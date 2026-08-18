"""
Simplified views for Users app.
"""
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

from .models import Profile
from .serializers import (
    UserSerializer,
    UserDetailSerializer,
    UserProfileUpdateSerializer,
    LoginSerializer
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """API endpoint for user registration."""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def create(self, request, *args, **kwargs):
        """Create a new user."""
        # Handle FormData with nested profile fields
        if hasattr(request.data, '_mutable'):
            # This is a QueryDict (FormData)
            data = request.data.copy()
            
            # Check if we have nested profile fields (profile.*)
            has_nested_profile = any(key.startswith('profile.') for key in data.keys())
            
            if has_nested_profile:
                # Restructure nested profile fields
                profile_data = {}
                profile_keys = [key for key in data.keys() if key.startswith('profile.')]
                
                for key in profile_keys:
                    field_name = key.replace('profile.', '')
                    value = data.pop(key)
                    # Handle QueryDict list values
                    if isinstance(value, list):
                        profile_data[field_name] = value[0] if value else ''
                    else:
                        profile_data[field_name] = value
                
                # Handle profile photo from files
                if 'profile.profile_photo' in request.FILES:
                    profile_data['profile_photo'] = request.FILES['profile.profile_photo']
                
                # Convert remaining data to dict
                user_data = {}
                for key, value in data.items():
                    if isinstance(value, list):
                        user_data[key] = value[0] if value else ''
                    else:
                        user_data[key] = value
                
                # Add profile data
                user_data['profile'] = profile_data
                data = user_data
            else:
                # Regular FormData without nested fields - convert to dict
                data = {}
                for key, value in request.data.items():
                    if isinstance(value, list):
                        data[key] = value[0] if value else ''
                    else:
                        data[key] = value
                
                # Handle files if any
                if request.FILES:
                    for key, file in request.FILES.items():
                        data[key] = file
        else:
            # JSON request - data is already a dict, use as-is
            data = request.data
        
        try:
            serializer = self.get_serializer(data=data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            user = serializer.save()

            return Response({
                'message': 'User registered successfully',
                'user': UserDetailSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            # Return validation errors in a clear format
            return Response({
                'message': 'Invalid request',
                'errors': e.detail
            }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """API endpoint for user login."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Login user and return JWT tokens."""
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Login successful',
            'user': UserDetailSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """API endpoint for user logout."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Logout user."""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)


class ProfileView(generics.RetrieveUpdateAPIView):
    """API endpoint for viewing and updating user profile."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        """Return appropriate serializer based on request method."""
        if self.request.method in ['PATCH', 'PUT']:
            return UserProfileUpdateSerializer
        return UserDetailSerializer

    def get_object(self):
        """Return the current user."""
        return self.request.user

    def update(self, request, *args, **kwargs):
        """Update user profile and return updated data."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle FormData with file uploads
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        
        # Handle nested profile fields from FormData (profile.*)
        if hasattr(request.data, '_mutable') or isinstance(request.data, dict):
            # This is a QueryDict (FormData) or dict
            profile_keys = [key for key in request.data.keys() if key.startswith('profile.')]
            if profile_keys:
                if 'profile' not in data:
                    data['profile'] = {}
                for key in profile_keys:
                    field_name = key.replace('profile.', '')
                    value = request.data.get(key)
                    if isinstance(value, list):
                        data['profile'][field_name] = value[0] if value else ''
                    else:
                        data['profile'][field_name] = value
        
        # Handle profile photo from nested FormData (profile.profile_photo)
        if 'profile.profile_photo' in request.FILES:
            if 'profile' not in data:
                data['profile'] = {}
            data['profile']['profile_photo'] = request.FILES['profile.profile_photo']
        # Also handle direct profile_photo upload (for backward compatibility)
        elif 'profile_photo' in request.FILES and instance.role in ['tenant', 'landlord']:
            if 'profile' not in data:
                data['profile'] = {}
            data['profile']['profile_photo'] = request.FILES['profile_photo']
        
        # Handle nested admin_profile fields (admin_profile.*)
        admin_profile_keys = [key for key in request.data.keys() if key.startswith('admin_profile.')]
        if admin_profile_keys:
            if 'admin_profile' not in data:
                data['admin_profile'] = {}
            for key in admin_profile_keys:
                field_name = key.replace('admin_profile.', '')
                value = request.data.get(key)
                if isinstance(value, list):
                    data['admin_profile'][field_name] = value[0] if value else ''
                else:
                    data['admin_profile'][field_name] = value
        
        serializer = self.get_serializer(instance, data=data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Refresh instance to get updated data
        instance.refresh_from_db()
        if hasattr(instance, 'profile'):
            try:
                instance.profile.refresh_from_db()
            except Profile.DoesNotExist:
                pass
        if hasattr(instance, 'admin_profile'):
            try:
                instance.admin_profile.refresh_from_db()
            except:
                pass

        # Return the updated data using UserDetailSerializer
        return Response(UserDetailSerializer(instance, context={'request': request}).data)


class PasswordResetRequestView(APIView):
    """
    Request a password reset email. Always returns 200 (even if the
    email is unknown) so we never reveal which emails are registered.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response(
                {'error': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user is not None:
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            # Fall back to the known production domain if FRONTEND_URL is
            # unset OR set to an empty string on the hosting platform.
            frontend_url = (getattr(settings, 'FRONTEND_URL', '') or 'https://propertree.site').rstrip('/')
            reset_link = f"{frontend_url}/reset-password?uid={uidb64}&token={token}"

            try:
                send_mail(
                    subject='Reset your Propertree password',
                    message=(
                        f"Hi,\n\nWe received a request to reset your Propertree "
                        f"password. Click the link below to choose a new one:\n\n"
                        f"{reset_link}\n\n"
                        f"If you didn't request this, you can safely ignore this email."
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception:
                # Don't leak SMTP errors to the client; log for debugging instead.
                import logging
                logging.getLogger(__name__).exception(
                    'Failed to send password reset email to %s', email
                )

        # Same response whether or not the user exists.
        return Response(
            {'message': 'If an account exists for that email, a reset link has been sent.'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    Confirm a password reset using the uid/token pair emailed to the user,
    and set the new password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get('uid') or request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('password') or request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response(
                {'error': 'uid, token and password are all required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is None or not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'This password reset link is invalid or has expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response({'error': exc.detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'error': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response(
            {'message': 'Password has been reset successfully.'},
            status=status.HTTP_200_OK
        )
