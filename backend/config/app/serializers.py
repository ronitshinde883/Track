from rest_framework import serializers

from .models import (
    User,
    College,
    Department,
    StudentProfile,
    TeacherProfile,
    AttendanceSession,
    Attendance,
)


class CollegeSerializer(serializers.ModelSerializer):
    class Meta:
        model = College
        fields = [
            "id",
            "name",
            "code",
            "email",
            "address",
            "joined_at",
        ]
        read_only_fields = [
            "id",
            "joined_at",
        ]


class DepartmentSerializer(serializers.ModelSerializer):
    college_name = serializers.CharField(
        source="college.name",
        read_only=True
    )

    class Meta:
        model = Department
        fields = [
            "id",
            "college",
            "college_name",
            "name",
        ]
        read_only_fields = [
            "id",
            "college_name",
        ]


class StudentProfileSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    college_name = serializers.CharField(
        source="college.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:

        model = StudentProfile

        fields = [
            "id",
            "user",
            "username",
            "college",
            "college_name",
            "department",
            "department_name",
            "enrollment_no",
            "division",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "college",
            "college_name",
            "department",
            "department_name",
            "enrollment_no",
        ]


class TeacherProfileSerializer(serializers.ModelSerializer):

    username = serializers.CharField(
        source="user.username",
        read_only=True
    )

    college_name = serializers.CharField(
        source="college.name",
        read_only=True
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:

        model = TeacherProfile

        fields = [
            "id",
            "user",
            "username",
            "college",
            "college_name",
            "department",
            "department_name",
            "employee_id",
            "status",
        ]

        read_only_fields = [
            "id",
            "user",
            "username",
            "college",
            "college_name",
            "department",
            "department_name",
            "employee_id",
            "status",
        ]


class AttendanceSessionSerializer(serializers.ModelSerializer):
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=True,
        allow_null=True,
    )
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = AttendanceSession

        fields = [
            "id",
            "teacher",
            "title",
            "department",
            "department_name",
            "qr_token",
            "created_at",
            "expires_at",
            "is_active",
        ]

        read_only_fields = [
            "id",
            "teacher",
            "qr_token",
            "created_at",
            "is_active",
        ]

    def validate_department(self, department):
        request = self.context.get("request")
        if request and department.college_id != request.user.teacher_profile.college_id:
            raise serializers.ValidationError(
                "Selected department must belong to your college."
            )
        return department

    def validate(self, attrs):
        if attrs.get("department") is None:
            raise serializers.ValidationError({
                "department": "A department is required for each session."
            })
        return attrs


class AttendanceSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(
        source="student.username",
        read_only=True
    )

    session_title = serializers.CharField(
        source="session.title",
        read_only=True
    )

    class Meta:
        model = Attendance

        fields = [
            "id",
            "student",
            "student_username",
            "session",
            "session_title",
            "marked_at",
        ]

        read_only_fields = [
            "id",
            "student",
            "student_username",
            "session",
            "session_title",
            "marked_at",
        ]
        
from django.db import transaction
from rest_framework import serializers
from .models import (
    User,
    College,
    Department,
    StudentProfile,
    TeacherProfile,
)


class RegisterSerializer(serializers.Serializer):

    username = serializers.CharField(
        max_length=150
    )

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    role = serializers.ChoiceField(
        choices=[
            User.Role.Student,
            User.Role.Teacher,
        ]
    )

    college = serializers.PrimaryKeyRelatedField(
        queryset=College.objects.all()
    )

    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
    )

  
    # STUDENT FIELDS
  

    enrollment_no = serializers.CharField(
        max_length=50,
        required=False
    )

    division = serializers.CharField(
        max_length=20,
        required=False
    )

    
    # TEACHER FIELD
   

    employee_id = serializers.CharField(
        max_length=20,
        required=False
    )

    # USERNAME VALIDATION
   

    def validate_username(self, value):

        if User.objects.filter(
            username=value
        ).exists():

            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

   
    # FULL VALIDATION
  

    def validate(self, data):

        role = data["role"]

        college = data.get("college")
        department = data.get("department")

      
        # COLLEGE + DEPARTMENT CHECK
      

        if college and department:

            if department.college_id != college.id:

                raise serializers.ValidationError({
                    "department": (
                        "Selected department does not belong "
                        "to the selected college."
                    )
                })

        
        # STUDENT VALIDATION
        

        if role == User.Role.Student:

            if department is None:
                raise serializers.ValidationError({
                    "department": "Department is required for students."
                })

            # Enrollment number required
            if not data.get("enrollment_no"):

                raise serializers.ValidationError({
                    "enrollment_no": (
                        "Enrollment number is required "
                        "for students."
                    )
                })

            # Division required
            if not data.get("division"):

                raise serializers.ValidationError({
                    "division": (
                        "Division is required for students."
                    )
                })

            # Enrollment number must be unique
            if StudentProfile.objects.filter(
                enrollment_no=data["enrollment_no"]
            ).exists():

                raise serializers.ValidationError({
                    "enrollment_no": (
                        "This enrollment number is "
                        "already registered."
                    )
                })

        # TEACHER VALIDATION
        

        elif role == User.Role.Teacher:

            # Employee ID required
            if not data.get("employee_id"):

                raise serializers.ValidationError({
                    "employee_id": (
                        "Employee ID is required "
                        "for teachers."
                    )
                })

            # Employee ID must be unique
            if TeacherProfile.objects.filter(
                employee_id=data["employee_id"]
            ).exists():

                raise serializers.ValidationError({
                    "employee_id": (
                        "This employee ID is "
                        "already registered."
                    )
                })

        return data

   
    # CREATE USER + PROFILE
   

    @transaction.atomic
    def create(self, validated_data):

        role = validated_data["role"]

        username = validated_data["username"]

        password = validated_data["password"]

        college = validated_data["college"]

        department = validated_data.get("department")

        
        # CREATE USER
       

        user = User.objects.create_user(
            username=username,
            password=password,
            role=role
        )

        # CREATE STUDENT PROFILE
       

        if role == User.Role.Student:

            StudentProfile.objects.create(
                user=user,
                college=college,
                department=department,
                enrollment_no=validated_data[
                    "enrollment_no"
                ],
                division=validated_data[
                    "division"
                ]
            )

        
        # CREATE TEACHER PROFILE
        

        else:

            TeacherProfile.objects.create(
                user=user,
                college=college,
                department=department,
                employee_id=validated_data[
                    "employee_id"
                ],
                status="PENDING"
            )

        return user


