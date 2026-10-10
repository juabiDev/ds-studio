-- Real shop address in place of the seeded placeholder. Guarded on the placeholder street so an
-- address already edited from the admin "Ajustes" page is never overwritten.
UPDATE "site_settings"
SET "street" = 'Colonia 1812 esq. Tristán Narvaja',
    "neighborhood" = 'Centro',
    "postal_code" = '11200',
    "latitude" = -34.90147,
    "longitude" = -56.17758,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "street" = 'Av. 18 de Julio 1234';
