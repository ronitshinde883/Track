from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceSessionViewSet,
    AttendanceViewSet,
    CollegeViewSet,
    DepartmentViewSet,
    StudentProfileViewSet,
    TeacherProfileViewSet,
    RegisterView,
    PendingTeacherListView,
    ApproveTeacherView,
    RejectTeacherView,
    AdminTeacherListView,
    AdminStudentListView,
    ApprovedTeacherListView,
    RejectedTeacherListView,
)

router = DefaultRouter()

router.register(
    "sessions",
    AttendanceSessionViewSet,
    basename="sessions"
)

router.register(
    "attendance",
    AttendanceViewSet,
    basename="attendance"
)

router.register(
    "colleges",
    CollegeViewSet,
    basename="colleges"
)

router.register(
    "departments",
    DepartmentViewSet,
    basename="departments"
)

router.register(
    "student-profiles",
    StudentProfileViewSet,
    basename="student-profiles"
)

router.register(
    "teacher-profiles",
    TeacherProfileViewSet,
    basename="teacher-profiles"
)

urlpatterns = [
    # Registration
    path(
        "auth/register/",
        RegisterView.as_view(),
        name="register"
    ),

    # Admin teacher lists
    path(
        "admin/teachers/pending/",
        PendingTeacherListView.as_view(),
        name="pending-teachers"
    ),

    path(
        "admin/teachers/approved/",
        ApprovedTeacherListView.as_view(),
        name="approved-teachers"
    ),

    path(
        "admin/teachers/rejected/",
        RejectedTeacherListView.as_view(),
        name="rejected-teachers"
    ),

    path(
        "admin/teachers/",
        AdminTeacherListView.as_view(),
        name="admin-teachers"
    ),

    # Admin student list
    path(
        "admin/students/",
        AdminStudentListView.as_view(),
        name="admin-students"
    ),

    # Admin approve/reject teacher
    path(
        "admin/teachers/<int:pk>/approve/",
        ApproveTeacherView.as_view(),
        name="approve-teacher"
    ),

    path(
        "admin/teachers/<int:pk>/reject/",
        RejectTeacherView.as_view(),
        name="reject-teacher"
    ),
] + router.urls