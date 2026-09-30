import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0003_adminprofile"),
    ]

    operations = [
        migrations.AlterField(
            model_name="teacherprofile",
            name="department",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="app.department",
            ),
        ),
        migrations.AddField(
            model_name="attendancesession",
            name="department",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="attendance_sessions",
                to="app.department",
            ),
        ),
    ]
