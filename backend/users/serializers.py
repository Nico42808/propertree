"""
Simplified serializers for Users app.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from .models import CustomUser, Profile, AdminProfile


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model."""
    
    profile_photo = serializers.ImageField(required=False, allow_null=True, allow_empty_file=True)
    identity_document = serializers.FileField(required=False, allow_null=True, write_only=True)
    identity_document_reviewed = serializers.SerializerMethodField(read_only=True)
    
    def to_representation(self, instance):
        """Return absolute URL for profile photo."""
        representation = super().to_representation(instance)
        if representation.get('profile_photo') and not representation['profile_photo'].startswith('http'):
            request = self.context.get('request')
            if request:
                representation['profile_photo'] = request.build_absolute_uri(representation['profile_photo'])
        return representation
    
    def get_identity_document_reviewed(self, obj):
        return bool(obj.identity_document_reviewed_at)

    def validate_identity_document(self, file):
        if not file:
            return file
        if file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError('ID document must be smaller than 10 MB.')
        allowed_types = {'application/pdf', 'image/jpeg', 'image/png'}
        content_type = getattr(file, 'content_type', '')
        if content_type not in allowed_types:
            raise serializers.ValidationError('ID document must be a PDF, JPG or PNG file.')
        return file

    class Meta:
        model = Profile
        fields = ['first_name', 'last_name', 'phone_number', 'profile_photo', 'identity_document', 'identity_document_reviewed', 'bio', 'address']


class AdminProfileSerializer(serializers.ModelSerializer):
    """Serializer for AdminProfile model."""
    
    class Meta:
        model = AdminProfile
        fields = ['first_name', 'last_name', 'phone_number', 'department']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    profile = ProfileSerializer(required=False)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'password', 'password2', 'role', 'profile', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        role = attrs.get('role')
        profile = attrs.get('profile') or {}
        if role == 'landlord' and not profile.get('identity_document'):
            raise serializers.ValidationError({'profile': {'identity_document': 'A valid ID document is required for landlord registration.'}})
        return attrs
    
    def create(self, validated_data):
        """Create a new user with profile."""
        profile_data = validated_data.pop('profile', {})
        validated_data.pop('password2', None)
        password = validated_data.pop('password')
        
        # Normalize email to lowercase
        validated_data['email'] = validated_data['email'].lower()
        
        # Create user
        user = CustomUser.objects.create_user(password=password, **validated_data)
        
        # Create appropriate profile based on role
        if user.role in ['tenant', 'landlord']:
            Profile.objects.create(user=user, **profile_data)
        elif user.role == 'admin':
            AdminProfile.objects.create(
                user=user,
                first_name=profile_data.get('first_name', ''),
                last_name=profile_data.get('last_name', ''),
                phone_number=profile_data.get('phone_number', '')
            )
        
        return user


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for user detail (includes profile)."""

    profile = ProfileSerializer(read_only=True)
    admin_profile = AdminProfileSerializer(read_only=True)
    has_identity_document = serializers.SerializerMethodField()
    identity_document_reviewed = serializers.SerializerMethodField()

    def get_has_identity_document(self, obj):
        try:
            return bool(obj.profile.identity_document)
        except Profile.DoesNotExist:
            return False

    def get_identity_document_reviewed(self, obj):
        try:
            return bool(obj.profile.identity_document_reviewed_at)
        except Profile.DoesNotExist:
            return False

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'role', 'is_active', 'is_verified', 'has_identity_document', 'identity_document_reviewed', 'profile', 'admin_profile', 'created_at']
        read_only_fields = ['id', 'email', 'created_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile."""

    profile = ProfileSerializer(required=False)
    admin_profile = AdminProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ['email', 'profile', 'admin_profile']
        read_only_fields = ['email']

    def update(self, instance, validated_data):
        """Update user and profile."""
        profile_data = validated_data.pop('profile', None)
        admin_profile_data = validated_data.pop('admin_profile', None)

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update profile based on user role
        if profile_data is not None and instance.role in ['tenant', 'landlord']:
            profile, created = Profile.objects.get_or_create(
                user=instance,
                defaults={
                    'first_name': profile_data.get('first_name', ''),
                    'last_name': profile_data.get('last_name', ''),
                }
            )
            for attr, value in profile_data.items():
                # Only update if value is not None (allows partial updates)
                if value is not None:
                    setattr(profile, attr, value)
            profile.save()

        if admin_profile_data is not None and instance.role == 'admin':
            admin_profile, created = AdminProfile.objects.get_or_create(
                user=instance,
                defaults={
                    'first_name': admin_profile_data.get('first_name', ''),
                    'last_name': admin_profile_data.get('last_name', ''),
                }
            )
            for attr, value in admin_profile_data.items():
                # Only update if value is not None (allows partial updates)
                if value is not None:
                    setattr(admin_profile, attr, value)
            admin_profile.save()

        return instance


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate user credentials."""
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include "email" and "password".')
