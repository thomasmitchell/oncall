# Generated by Django 3.2.16 on 2022-12-05 07:00

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('user_management', '0005_rbac_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='uuid',
            field=models.UUIDField(default=uuid.uuid4, editable=False),
        ),
    ]