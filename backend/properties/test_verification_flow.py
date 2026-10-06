from decimal import Decimal

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from users.models import CustomUser, Profile
from properties.models import Property
from properties.documents import PropertyDocument


PDF_BYTES = b'%PDF-1.4\n% Propertree verification test\n%%EOF\n'


class VerificationFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = CustomUser.objects.create_user(
            email='admin-test@propertree.site',
            password='TestPassword123!',
            role='admin',
            is_staff=True,
            is_verified=True,
        )
        self.landlord = CustomUser.objects.create_user(
            email='landlord-test@propertree.site',
            password='TestPassword123!',
            role='landlord',
            is_verified=False,
        )
        self.profile = Profile.objects.create(
            user=self.landlord,
            first_name='Test',
            last_name='Landlord',
            identity_document='identity_documents/test-id.pdf',
            identity_document_blob=PDF_BYTES,
            identity_document_filename='test-id.pdf',
            identity_document_content_type='application/pdf',
        )
        self.client.force_authenticate(user=self.admin)

    def test_landlord_id_must_be_retrieved_before_approval(self):
        verify_url = f'/api/admin/users/{self.landlord.id}/verify/'
        download_url = f'/api/admin/users/{self.landlord.id}/identity-document/'

        blocked = self.client.post(verify_url)
        self.assertEqual(blocked.status_code, 400)
        self.assertFalse(self.landlord.is_verified)

        response = self.client.get(download_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, PDF_BYTES)
        self.assertEqual(response['Content-Type'], 'application/pdf')

        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.identity_document_reviewed_at)
        self.assertEqual(self.profile.identity_document_reviewed_by_id, self.admin.id)

        approved = self.client.post(verify_url)
        self.assertEqual(approved.status_code, 200)

        self.landlord.refresh_from_db()
        self.assertTrue(self.landlord.is_verified)

    def test_property_proof_must_be_retrieved_before_property_approval(self):
        self.landlord.is_verified = True
        self.landlord.save(update_fields=['is_verified'])

        property_obj = Property.objects.create(
            landlord=self.landlord,
            title='Verification Test Property',
            description='Test property',
            property_type='house',
            address='1 Test Street',
            city='Halifax',
            state='Nova Scotia',
            country='Canada',
            postal_code='B3H 1A1',
            bedrooms=3,
            bathrooms=Decimal('2.0'),
            max_guests=1,
            price_per_night=Decimal('0.00'),
            status='pending_approval',
        )
        document = PropertyDocument.objects.create(
            property=property_obj,
            uploaded_by=self.landlord,
            title='Proof of Ownership',
            category='proof_of_ownership',
            file='property_documents/test-proof.pdf',
            verification_blob=PDF_BYTES,
            verification_filename='test-proof.pdf',
            verification_content_type='application/pdf',
        )

        approve_url = f'/api/admin/properties/{property_obj.id}/approve/'
        download_url = f'/api/properties/documents/{document.id}/download/'

        blocked = self.client.post(approve_url)
        self.assertEqual(blocked.status_code, 400)

        response = self.client.get(download_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, PDF_BYTES)
        self.assertEqual(response['Content-Type'], 'application/pdf')

        document.refresh_from_db()
        self.assertIsNotNone(document.reviewed_at)
        self.assertEqual(document.reviewed_by_id, self.admin.id)

        approved = self.client.post(approve_url)
        self.assertEqual(approved.status_code, 200)

        property_obj.refresh_from_db()
        self.assertEqual(property_obj.status, 'approved')
        self.assertEqual(property_obj.approved_by_id, self.admin.id)


    def test_landlord_can_upload_id_to_durable_storage_and_admin_can_view_json(self):
        landlord_client = APIClient()
        landlord_client.force_authenticate(user=self.landlord)
        upload = SimpleUploadedFile('fresh-id.pdf', PDF_BYTES, content_type='application/pdf')

        uploaded = landlord_client.post(
            '/api/auth/identity-document/',
            {'file': upload},
            format='multipart',
        )
        self.assertEqual(uploaded.status_code, 200)

        self.profile.refresh_from_db()
        self.assertEqual(bytes(self.profile.identity_document_blob), PDF_BYTES)
        self.assertEqual(self.profile.identity_document_filename, 'fresh-id.pdf')
        self.assertEqual(self.profile.identity_document_content_type, 'application/pdf')

        response = self.client.get(
            f'/api/admin/users/{self.landlord.id}/identity-document/?format=json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['filename'], 'fresh-id.pdf')
        self.assertEqual(response.data['content_type'], 'application/pdf')
        self.assertTrue(response.data['content_base64'])

    def test_property_verification_upload_is_db_backed_and_admin_can_view_json(self):
        self.landlord.is_verified = True
        self.landlord.save(update_fields=['is_verified'])

        property_obj = Property.objects.create(
            landlord=self.landlord,
            title='DB Backed Property',
            description='Test property',
            property_type='house',
            address='2 Test Street',
            city='Halifax',
            state='Nova Scotia',
            country='Canada',
            postal_code='B3H 1A2',
            bedrooms=2,
            bathrooms=Decimal('1.0'),
            max_guests=1,
            price_per_night=Decimal('0.00'),
            status='draft',
        )

        landlord_client = APIClient()
        landlord_client.force_authenticate(user=self.landlord)
        upload = SimpleUploadedFile('proof.pdf', PDF_BYTES, content_type='application/pdf')
        created = landlord_client.post(
            f'/api/properties/landlord/{property_obj.id}/documents/',
            {
                'title': 'Proof of Ownership',
                'category': 'proof_of_ownership',
                'file': upload,
            },
            format='multipart',
        )
        self.assertEqual(created.status_code, 201)

        document = PropertyDocument.objects.get(pk=created.data['id'])
        self.assertEqual(bytes(document.verification_blob), PDF_BYTES)
        self.assertFalse(bool(document.file))

        response = self.client.get(
            f'/api/properties/documents/{document.id}/download/?format=json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['filename'], 'proof.pdf')
        self.assertEqual(response.data['content_type'], 'application/pdf')
        self.assertTrue(response.data['content_base64'])
