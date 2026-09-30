from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from django.utils import timezone

from .permissions import (
    IsStudent,
    IsTeacher,
    IsTeacherOrStudent,
    IsAdmin,
)

from .models import (
    AttendanceSession,
    Attendance,
    College,
    Department,
    StudentProfile,
    TeacherProfile,
)

from .serializers import (
    AttendanceSessionSerializer,
    AttendanceSerializer,
    CollegeSerializer,
    DepartmentSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer,
    RegisterSerializer,
)

class AttendanceSessionViewSet(ModelViewSet):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated, IsTeacher]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        return AttendanceSession.objects.filter(
            teacher=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(
            teacher=self.request.user
        )


class AttendanceViewSet(ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [
        IsAuthenticated,
        IsTeacherOrStudent
    ]
    http_method_names = ["get", "post"]

    def get_queryset(self):
        if self.request.user.role == "STUDENT":
            return Attendance.objects.filter(
                student=self.request.user
            )

        if self.request.user.role == "TEACHER":
            return Attendance.objects.filter(
                session__teacher=self.request.user
            )

        return Attendance.objects.none()

    def create(self, request, *args, **kwargs):
        return Response(
            {
                "error": (
                    "Direct attendance creation is not allowed. "
                    "Scan the QR code."
                )
            },
            status=status.HTTP_403_FORBIDDEN
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="scan"
    )
    def scan(self, request):

        qr_token = request.data.get("qr_token")

        # Only students can scan attendance QR
        if request.user.role != "STUDENT":
            return Response(
                {
                    "error": (
                        "Only students can mark attendance."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # QR token is required
        if not qr_token:
            return Response(
                {
                    "error": "QR token is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find attendance session
        try:
            session = AttendanceSession.objects.get(
                qr_token=qr_token
            )
        except AttendanceSession.DoesNotExist:
            return Response(
                {
                    "error": "Invalid QR code."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Check whether session is active
        if not session.is_active:
            return Response(
                {
                    "error": (
                        "This attendance session is inactive."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check QR expiry
        if timezone.now() > session.expires_at:
            return Response(
                {
                    "error": "This QR code has expired."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get student and teacher profiles
        student_profile = request.user.student_profile
        teacher_profile = session.teacher.teacher_profile

        # Student and teacher must belong to same college
        if (
            student_profile.college_id
            != teacher_profile.college_id
        ):
            return Response(
                {
                    "error": (
                        "You cannot mark attendance "
                        "for another college."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        if (
            session.department_id is not None
            and student_profile.department_id != session.department_id
        ):
            return Response(
                {
                    "error": (
                        "This attendance session is for a different department."
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # Prevent duplicate attendance
        if Attendance.objects.filter(
            student=request.user,
            session=session
        ).exists():
            return Response(
                {
                    "error": "Attendance already marked."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Mark attendance
        attendance = Attendance.objects.create(
            student=request.user,
            session=session
        )

        serializer = AttendanceSerializer(
            attendance
        )

        return Response(
            {
                "message": (
                    "Attendance marked successfully."
                ),
                "attendance": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class CollegeViewSet(ModelViewSet):
    queryset = College.objects.all()
    serializer_class = CollegeSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]


class DepartmentViewSet(ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]


class StudentProfileViewSet(ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [
        IsAuthenticated,
        IsStudent
    ]
    http_method_names = ["get", "patch"]

    def get_queryset(self):
        return StudentProfile.objects.filter(
            user=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(
            user=self.request.user
        )


class TeacherProfileViewSet(ModelViewSet):
    serializer_class = TeacherProfileSerializer
    permission_classes = [
        IsAuthenticated,
        IsTeacher
    ]
    http_method_names = ["get", "patch"]

    def get_queryset(self):
        return TeacherProfile.objects.filter(
            user=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(
            user=self.request.user
        )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(
            data=request.data
        )

        if serializer.is_valid():

            user = serializer.save()

            return Response(
                {
                    "message": (
                        "Registration successful."
                    ),
                    "username": user.username,
                    "role": user.role,
                    "status": (
                        "PENDING"
                        if user.role == "TEACHER"
                        else "APPROVED"
                    )
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class AdminTeacherListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def get(self, request):

        teachers = TeacherProfile.objects.filter(
            college=request.user.admin_profile.college
        ).order_by("-id")

        serializer = TeacherProfileSerializer(
            teachers,
            many=True
        )

        return Response(serializer.data)


class AdminStudentListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def get(self, request):

        students = StudentProfile.objects.filter(
            college=request.user.admin_profile.college
        ).order_by("-id")

        serializer = StudentProfileSerializer(
            students,
            many=True
        )

        return Response(serializer.data)


class PendingTeacherListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def get(self, request):

        teachers = TeacherProfile.objects.filter(
            college=request.user.admin_profile.college,
            status="PENDING"
        ).order_by("-id")

        serializer = TeacherProfileSerializer(
            teachers,
            many=True
        )

        return Response(serializer.data)


class ApprovedTeacherListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def get(self, request):

        teachers = TeacherProfile.objects.filter(
            college=request.user.admin_profile.college,
            status="APPROVED"
        ).order_by("-id")

        serializer = TeacherProfileSerializer(
            teachers,
            many=True
        )

        return Response(serializer.data)


class RejectedTeacherListView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def get(self, request):

        teachers = TeacherProfile.objects.filter(
            college=request.user.admin_profile.college,
            status="REJECTED"
        ).order_by("-id")

        serializer = TeacherProfileSerializer(
            teachers,
            many=True
        )

        return Response(serializer.data)


class ApproveTeacherView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def post(self, request, pk):

        try:
            teacher = TeacherProfile.objects.get(
                id=pk,
                college=request.user.admin_profile.college
            )

        except TeacherProfile.DoesNotExist:
            return Response(
                {
                    "error": (
                        "Teacher profile not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if teacher.status != "PENDING":
            return Response(
                {
                    "error": (
                        "This teacher request has "
                        "already been processed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        teacher.status = "APPROVED"
        teacher.save()

        return Response(
            {
                "message": (
                    "Teacher approved successfully."
                ),
                "teacher": TeacherProfileSerializer(
                    teacher
                ).data
            },
            status=status.HTTP_200_OK
        )


class RejectTeacherView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsAdmin
    ]

    def post(self, request, pk):

        try:
            teacher = TeacherProfile.objects.get(
                id=pk,
                college=request.user.admin_profile.college
            )

        except TeacherProfile.DoesNotExist:
            return Response(
                {
                    "error": (
                        "Teacher profile not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if teacher.status != "PENDING":
            return Response(
                {
                    "error": (
                        "This teacher request has "
                        "already been processed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        teacher.status = "REJECTED"
        teacher.save()

        return Response(
            {
                "message": (
                    "Teacher rejected successfully."
                ),
                "teacher": TeacherProfileSerializer(
                    teacher
                ).data
            },
            status=status.HTTP_200_OK
        )
