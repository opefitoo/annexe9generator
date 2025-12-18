# Generated migration for adding title fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_operatorconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='operatorconfig',
            name='title',
            field=models.CharField(
                choices=[('Madame', 'Madame'), ('Monsieur', 'Monsieur'), ('Société', 'Société')],
                default='Société',
                max_length=20,
                verbose_name='Titre',
            ),
        ),
        migrations.AddField(
            model_name='client',
            name='title',
            field=models.CharField(
                choices=[('Madame', 'Madame'), ('Monsieur', 'Monsieur'), ('Société', 'Société')],
                default='Monsieur',
                max_length=20,
                verbose_name='Titre',
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='operator_title',
            field=models.CharField(
                choices=[('Madame', 'Madame'), ('Monsieur', 'Monsieur'), ('Société', 'Société')],
                default='Société',
                max_length=20,
                verbose_name='Titre exploitant',
            ),
        ),
        migrations.AddField(
            model_name='order',
            name='client_title',
            field=models.CharField(
                choices=[('Madame', 'Madame'), ('Monsieur', 'Monsieur'), ('Société', 'Société')],
                default='Monsieur',
                max_length=20,
                verbose_name='Titre client',
            ),
        ),
    ]
