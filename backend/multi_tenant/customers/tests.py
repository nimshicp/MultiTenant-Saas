import pytest

from customers.models import Domain, Tenant


pytestmark = pytest.mark.django_db


def test_tenant_string_representation():
    tenant = Tenant(name="Acme Corp", schema_name="tenant_acme")

    assert str(tenant) == "Acme Corp (tenant_acme)"


def test_domain_string_representation():
    tenant = Tenant(name="Acme Corp", schema_name="tenant_acme")
    domain = Domain(domain="acme.localhost", tenant=tenant)

    assert str(domain) == "acme.localhost"
