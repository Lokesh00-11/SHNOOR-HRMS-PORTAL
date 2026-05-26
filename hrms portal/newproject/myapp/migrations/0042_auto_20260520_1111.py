import uuid
from django.db import migrations

def gen_uuid(apps, schema_editor):
    User = apps.get_model('myapp', 'User')
    for row in User.objects.all():
        if not row.feed_token:
            row.feed_token = uuid.uuid4()
            row.save(update_fields=['feed_token'])

class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0041_plannerlock_plannerevent_is_locked_and_more'),
    ]

    operations = [
        migrations.RunPython(gen_uuid, elidable=True),
    ]
