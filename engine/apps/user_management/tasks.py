from apps.user_management.models import User
from common.custom_celery_tasks import shared_dedicated_queue_retry_task


@shared_dedicated_queue_retry_task()
def start_create_default_user_notification_policies(organization_id, grafana_user_ids):
    users = User.objects.filter(organization_id=organization_id, user_id__in=grafana_user_ids)
    for u in users:
        create_default_user_notification_policies.apply_async((u.id,))


@shared_dedicated_queue_retry_task(autoretry_for=(Exception,), retry_backoff=True, max_retries=3)
def create_default_user_notification_policies(user_id):
    user = User.objects.get(id=user_id)
    if user.notification_policies.filter(important=False).count() == 0:
        user.notification_policies.create_default_policies_for_user(user)
    if user.notification_policies.filter(important=True).count() == 0:
        user.notification_policies.create_important_policies_for_user(user)
