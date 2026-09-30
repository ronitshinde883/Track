from rest_framework.permissions import BasePermission
from .models import User


class IsTeacher(BasePermission):

    def has_permission(self, request, view):

        if not request.user.is_authenticated:
            return False

        if request.user.role != User.Role.Teacher:
            return False

        try:
            profile = request.user.teacher_profile
        except Exception:
            return False

        return profile.status == "APPROVED"


class IsStudent(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user.is_authenticated
            and request.user.role == User.Role.Student
        )


class IsTeacherOrStudent(BasePermission):

    def has_permission(self, request, view):

        return (
            request.user.is_authenticated
            and request.user.role in [
                User.Role.Teacher,
                User.Role.Student,
            ]
        )
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.user.role != User.Role.ADMIN:
            return False

        try:
            request.user.admin_profile
        except Exception:
            return False

        return True