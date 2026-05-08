from django.db import models

class TenantUserMap(models.Model):


    email = models.EmailField()

    schema_name = models.CharField(
        max_length=100
    )

    role = models.CharField(
        max_length=30
    )

    class Meta:

        unique_together = (
            "email",
            "schema_name"
        )

    def __str__(self):

        return f"{self.email} -> {self.schema_name}"

