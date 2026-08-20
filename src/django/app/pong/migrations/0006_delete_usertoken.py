from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pong', '0005_blockeduser'),
    ]

    operations = [
        migrations.DeleteModel(
            name='UserToken',
        ),
    ]
