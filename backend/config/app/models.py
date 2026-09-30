from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator,MaxValueValidator
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

class User(AbstractUser):
    class Role(models.TextChoices):
        Student="STUDENT","Student"
        Teacher="TEACHER","Teacher"
        ADMIN="ADMIN","Admin"
    role=models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.Student,
    )
    enrollment_number=models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True,
        
    )
    
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.username
    
import uuid

class AttendanceSession(models.Model):

    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendance_sessions"
    )

    title = models.CharField(max_length=200)

    department = models.ForeignKey(
        "Department",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attendance_sessions",
    )

    qr_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False
    )

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title
    
class Attendance(models.Model):
    student=models.ForeignKey(
        
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="attendace_records"
    )
    session=models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name="attendace_records"
    )
    marked_at=models.DateTimeField(auto_now_add=True)
    #avoid duplicate
    class Meta:
        constraints=[
            models.UniqueConstraint(
                fields=["student","session"],
                name="unique_student_session_attendance"
            )
        ]
    def __str__(self):
        return f"{self.student.username}-{self.session.title}"

class College(models.Model):
    name=models.CharField(max_length=200)
    code=models.CharField(max_length=50,unique=True)
    email=models.EmailField()
    address=models.TextField()
    joined_at=models.DateTimeField(auto_now_add=True)
    ##end date will be discussed
    def __str__(self):
        return self.name
    
class Department(models.Model):
    college=models.ForeignKey(
        College,on_delete=models.CASCADE
    )
    name=models.CharField(max_length=200)
    def __str__(self):
        return self.name
    
class StudentProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="student_profile"
    )
    college = models.ForeignKey(
        College,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    enrollment_no = models.CharField(
        max_length=50,
        unique=True
    )
    division = models.CharField(max_length=20)

    def clean(self):
        if TeacherProfile.objects.filter(user=self.user).exists():
            raise ValidationError(
                "This user is already registered as a teacher."
            )

    def __str__(self):
        return self.user.username


class TeacherProfile(models.Model):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="teacher_profile"
    )
    college = models.ForeignKey(
        College,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    employee_id = models.CharField(
        max_length=20,
        unique=True
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="PENDING"
    )

    def clean(self):
        if StudentProfile.objects.filter(user=self.user).exists():
            raise ValidationError(
                "This user is already registered as a student."
            )

    def __str__(self):
        return self.user.username
    
    
class AdminProfile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="admin_profile"
    )

    college = models.ForeignKey(
        College,
        on_delete=models.CASCADE,
        related_name="admin_profiles"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.college.name}"
