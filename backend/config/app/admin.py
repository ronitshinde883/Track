from django.contrib import admin
from .models import AttendanceSession,Attendance,TeacherProfile,StudentProfile,College,Department,AdminProfile
# Register your models here.

admin.site.register(AttendanceSession)
admin.site.register(Attendance)
admin.site.register(StudentProfile)
admin.site.register(College)
admin.site.register(TeacherProfile)
admin.site.register(Department)
admin.site.register(AdminProfile)