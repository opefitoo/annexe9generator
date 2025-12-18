import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Helper function to fill operator fields only if section is visible
async function fillOperatorIfVisible(page: Page, operator: typeof testOrders[0]['operator']) {
  const operatorNameField = page.locator('input[name="operator_name"]');
  if (await operatorNameField.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.fill('input[name="operator_name"]', operator.name);
    await page.fill('input[name="operator_address"]', operator.address);
    await page.fill('input[name="operator_address_number"]', operator.addressNumber);
    await page.fill('input[name="operator_postal_code"]', operator.postalCode);
    await page.fill('input[name="operator_locality"]', operator.locality);
    await page.fill('input[name="operator_bce_number"]', operator.bceNumber);
    await page.fill('input[name="operator_authorization_number"]', operator.authorizationNumber);
  }
  // If not visible, operator is pre-configured - no action needed
}

// Test data for orders
const testOrders = [
  {
    operator: {
      name: 'Taxi Express SPRL',
      address: 'Rue de la Gare',
      addressNumber: '15',
      postalCode: '5000',
      locality: 'Namur',
      bceNumber: '0123.456.789',
      authorizationNumber: 'TC-2020-001',
    },
    client: {
      name: 'Jean Dupont',
      address: 'Avenue des Alliés',
      addressNumber: '42',
      postalCode: '5100',
      locality: 'Jambes',
      phone: '081123456',
      gsm: '0471234567',
      adultsCount: '2',
      childrenCount: '1',
    },
    service: {
      type: 'aller_retour',
      aller: {
        date: '2025-01-15',
        time: '08:30',
        departure: 'Gare de Namur',
        destination: 'Aéroport de Charleroi',
        price: '45.00',
      },
      retour: {
        date: '2025-01-20',
        time: '18:00',
        departure: 'Aéroport de Charleroi',
        destination: 'Gare de Namur',
        price: '45.00',
      },
    },
  },
  {
    operator: {
      name: 'Mobilité Wallonne SA',
      address: 'Boulevard du Nord',
      addressNumber: '88',
      postalCode: '4000',
      locality: 'Liège',
      bceNumber: '0987.654.321',
      authorizationNumber: 'TC-2019-042',
    },
    client: {
      name: 'Marie Martin',
      address: 'Rue Haute',
      addressNumber: '7',
      postalCode: '4020',
      locality: 'Liège',
      phone: '042234567',
      gsm: '0498765432',
      adultsCount: '1',
      childrenCount: '0',
    },
    service: {
      type: 'aller',
      aller: {
        date: '2025-01-18',
        time: '14:00',
        departure: 'CHU de Liège',
        destination: 'Gare de Liège-Guillemins',
        price: '15.50',
      },
    },
  },
  {
    operator: {
      name: 'Collectif Transport Mons',
      address: 'Grand Place',
      addressNumber: '1',
      postalCode: '7000',
      locality: 'Mons',
      bceNumber: '0555.444.333',
      authorizationNumber: 'TC-2021-015',
    },
    client: {
      name: 'Pierre Leroy',
      address: 'Rue des Fripiers',
      addressNumber: '23',
      postalCode: '7000',
      locality: 'Mons',
      phone: '065345678',
      gsm: '0477889900',
      adultsCount: '3',
      childrenCount: '2',
    },
    service: {
      type: 'retour',
      retour: {
        date: '2025-01-22',
        time: '16:30',
        departure: 'Parc Paradisio',
        destination: 'Centre-ville de Mons',
        price: '35.00',
      },
    },
  },
];

test.describe('Annex 9 Generator - Bon de Commande Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(BASE_URL);

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Fill login form
    await page.fill('input[autocomplete="username"]', 'admin');
    await page.fill('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(BASE_URL + '/', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
  });

  test('should display dashboard after login', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Tableau de bord');
    await expect(page.getByText('Total bons')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Nouveau bon de commande' })).toBeVisible();
  });

  test('should create first order (Aller/Retour)', async ({ page }) => {
    const order = testOrders[0];

    // Navigate to new order page
    await page.getByRole('link', { name: 'Nouveau bon de commande' }).first().click();
    await expect(page).toHaveURL(/.*orders\/new/);
    await expect(page.getByRole('heading', { name: 'Nouveau bon de commande' })).toBeVisible();

    // Fill reservation section
    await page.fill('input[name="reservation_date"]', '2025-01-10');

    // Fill operator section (only if visible - may be pre-configured)
    await fillOperatorIfVisible(page, order.operator);

    // Fill client section
    await page.fill('input[name="client_name"]', order.client.name);
    await page.fill('input[name="client_address"]', order.client.address);
    await page.fill('input[name="client_address_number"]', order.client.addressNumber);
    await page.fill('input[name="client_postal_code"]', order.client.postalCode);
    await page.fill('input[name="client_locality"]', order.client.locality);
    await page.fill('input[name="client_phone"]', order.client.phone);
    await page.fill('input[name="client_gsm"]', order.client.gsm);
    await page.fill('input[name="passengers_adult"]', order.client.adultsCount);
    await page.fill('input[name="passengers_child"]', order.client.childrenCount);

    // Select service type
    await page.selectOption('select[name="service_type"]', order.service.type);

    // Fill aller trip details
    await page.fill('input[name="aller_date"]', order.service.aller!.date);
    await page.fill('input[name="aller_time"]', order.service.aller!.time);
    await page.fill('input[name="aller_departure"]', order.service.aller!.departure);
    await page.fill('input[name="aller_destination"]', order.service.aller!.destination);
    await page.fill('input[name="aller_price"]', order.service.aller!.price);

    // Fill retour trip details
    await page.fill('input[name="retour_date"]', order.service.retour!.date);
    await page.fill('input[name="retour_time"]', order.service.retour!.time);
    await page.fill('input[name="retour_departure"]', order.service.retour!.departure);
    await page.fill('input[name="retour_destination"]', order.service.retour!.destination);
    await page.fill('input[name="retour_price"]', order.service.retour!.price);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to order detail page
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+$/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /TC-/ })).toBeVisible();
    await expect(page.getByText(order.client.name)).toBeVisible();

    console.log('✓ Created order for:', order.client.name);
  });

  test('should create second order (Aller only)', async ({ page }) => {
    const order = testOrders[1];

    await page.getByRole('link', { name: 'Nouveau bon de commande' }).first().click();
    await expect(page).toHaveURL(/.*orders\/new/);

    // Fill reservation
    await page.fill('input[name="reservation_date"]', '2025-01-12');

    // Fill operator (only if visible - may be pre-configured)
    await fillOperatorIfVisible(page, order.operator);

    // Fill client
    await page.fill('input[name="client_name"]', order.client.name);
    await page.fill('input[name="client_address"]', order.client.address);
    await page.fill('input[name="client_address_number"]', order.client.addressNumber);
    await page.fill('input[name="client_postal_code"]', order.client.postalCode);
    await page.fill('input[name="client_locality"]', order.client.locality);
    await page.fill('input[name="client_phone"]', order.client.phone);
    await page.fill('input[name="client_gsm"]', order.client.gsm);
    await page.fill('input[name="passengers_adult"]', order.client.adultsCount);
    await page.fill('input[name="passengers_child"]', order.client.childrenCount);

    // Select Aller only
    await page.selectOption('select[name="service_type"]', order.service.type);

    // Fill aller trip
    await page.fill('input[name="aller_date"]', order.service.aller!.date);
    await page.fill('input[name="aller_time"]', order.service.aller!.time);
    await page.fill('input[name="aller_departure"]', order.service.aller!.departure);
    await page.fill('input[name="aller_destination"]', order.service.aller!.destination);
    await page.fill('input[name="aller_price"]', order.service.aller!.price);

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+$/, { timeout: 10000 });
    await expect(page.getByText(order.client.name)).toBeVisible();

    console.log('✓ Created order for:', order.client.name);
  });

  test('should create third order (Retour only)', async ({ page }) => {
    const order = testOrders[2];

    await page.getByRole('link', { name: 'Nouveau bon de commande' }).first().click();
    await expect(page).toHaveURL(/.*orders\/new/);

    // Fill reservation
    await page.fill('input[name="reservation_date"]', '2025-01-14');

    // Fill operator (only if visible - may be pre-configured)
    await fillOperatorIfVisible(page, order.operator);

    // Fill client
    await page.fill('input[name="client_name"]', order.client.name);
    await page.fill('input[name="client_address"]', order.client.address);
    await page.fill('input[name="client_address_number"]', order.client.addressNumber);
    await page.fill('input[name="client_postal_code"]', order.client.postalCode);
    await page.fill('input[name="client_locality"]', order.client.locality);
    await page.fill('input[name="client_phone"]', order.client.phone);
    await page.fill('input[name="client_gsm"]', order.client.gsm);
    await page.fill('input[name="passengers_adult"]', order.client.adultsCount);
    await page.fill('input[name="passengers_child"]', order.client.childrenCount);

    // Select Retour only
    await page.selectOption('select[name="service_type"]', order.service.type);

    // Fill retour trip
    await page.fill('input[name="retour_date"]', order.service.retour!.date);
    await page.fill('input[name="retour_time"]', order.service.retour!.time);
    await page.fill('input[name="retour_departure"]', order.service.retour!.departure);
    await page.fill('input[name="retour_destination"]', order.service.retour!.destination);
    await page.fill('input[name="retour_price"]', order.service.retour!.price);

    // Submit
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+$/, { timeout: 10000 });
    await expect(page.getByText(order.client.name)).toBeVisible();

    console.log('✓ Created order for:', order.client.name);
  });

  test('should list all orders', async ({ page }) => {
    // Navigate to orders list
    await page.getByRole('link', { name: 'Bons de commande' }).click();
    await expect(page).toHaveURL(/.*orders$/);
    await expect(page.getByRole('heading', { name: 'Bons de commande' })).toBeVisible();

    // Check table is visible
    await expect(page.locator('table')).toBeVisible();

    // Log how many orders we see
    const rows = await page.locator('tbody tr').count();
    console.log(`✓ Found ${rows} orders in the list`);
  });

  test('should search orders by client name', async ({ page }) => {
    await page.getByRole('link', { name: 'Bons de commande' }).click();
    await expect(page).toHaveURL(/.*orders$/);

    // Search for a specific client
    await page.fill('input[placeholder*="Rechercher"]', 'Dupont');
    await page.waitForTimeout(1000); // Wait for search to apply

    // Log results
    const rows = await page.locator('tbody tr').count();
    console.log(`✓ Search found ${rows} order(s) for "Dupont"`);
  });

  test('should view order details and generate PDF', async ({ page, request }) => {
    // Go to orders list
    await page.getByRole('link', { name: 'Bons de commande' }).click();
    await expect(page).toHaveURL(/.*orders$/);

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => {});

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      console.log('⚠ No orders found to view details');
      return;
    }

    // Click on first order reference
    const firstOrderLink = page.locator('tbody tr:first-child a').first();
    await firstOrderLink.click();

    // Should be on order detail page
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+$/);

    // Get order ID from URL
    const url = page.url();
    const orderId = url.split('/').pop();

    // Check order details are displayed
    await expect(page.getByRole('heading', { name: 'Réservation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Exploitant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Client' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Service' })).toBeVisible();

    // Generate PDF
    const generateButton = page.getByRole('button', { name: /Générer PDF|Regénérer PDF/ });
    await expect(generateButton).toBeVisible();
    await generateButton.click();

    // Wait for success toast
    await expect(page.getByText('PDF généré avec succès')).toBeVisible({ timeout: 10000 });
    console.log('✓ PDF generated successfully');

    // Check that download button appears
    const downloadButton = page.getByRole('button', { name: 'Télécharger PDF' });
    await expect(downloadButton).toBeVisible({ timeout: 5000 });
    console.log('✓ PDF download button is available');

    // Verify PDF preview endpoint returns valid PDF
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const previewResponse = await request.get(`http://localhost:8000/api/pdf/${orderId}/preview?token=${token}`);
    expect(previewResponse.status()).toBe(200);
    expect(previewResponse.headers()['content-type']).toBe('application/pdf');
    console.log('✓ PDF preview endpoint returns valid PDF');
  });

  test('should filter orders by status', async ({ page }) => {
    await page.getByRole('link', { name: 'Bons de commande' }).click();
    await expect(page).toHaveURL(/.*orders$/);

    // Filter by draft status
    await page.locator('select').first().selectOption('draft');
    await page.waitForTimeout(500);

    const draftRows = await page.locator('tbody tr').count();
    console.log(`✓ Found ${draftRows} draft order(s)`);

    // Reset filter
    await page.locator('select').first().selectOption('');
    await page.waitForTimeout(500);

    const allRows = await page.locator('tbody tr').count();
    console.log(`✓ Total orders: ${allRows}`);
  });

  test('should edit an existing order', async ({ page }) => {
    // Go to orders list
    await page.getByRole('link', { name: 'Bons de commande' }).click();
    await page.waitForTimeout(500);

    // Wait for table to load
    await page.waitForSelector('tbody tr', { timeout: 5000 }).catch(() => {});

    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      console.log('⚠ No orders found to edit');
      return;
    }

    // Click modify on first order
    await page.locator('tbody tr:first-child').getByText('Modifier').click();

    // Should be on edit page
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+\/edit$/);

    // Change client GSM
    const gsmInput = page.locator('input[name="client_gsm"]');
    await gsmInput.clear();
    await gsmInput.fill('0499999999');

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to detail page
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+$/, { timeout: 10000 });

    console.log('✓ Order successfully edited');
  });

  test('should display dashboard statistics', async ({ page }) => {
    // Already on dashboard after login
    await page.goto(BASE_URL);

    // Check stats cards
    await expect(page.getByText('Total bons')).toBeVisible();
    await expect(page.getByText('Brouillons')).toBeVisible();
    await expect(page.getByText('PDF Générés')).toBeVisible();
    await expect(page.getByText('Envoyés')).toBeVisible();

    // Check recent orders section
    await expect(page.getByText('Derniers bons de commande')).toBeVisible();

    console.log('✓ Dashboard statistics displayed correctly');
  });

  test('should generate signature link and access public signature page', async ({ page }) => {
    // Go to orders list
    await page.goto(`${BASE_URL}/orders`);
    await page.waitForSelector('table');

    // Click on first order
    const firstOrderLink = page.locator('tbody tr a').first();
    await firstOrderLink.click();

    // Wait for order detail page
    await expect(page).toHaveURL(/.*orders\/[a-f0-9-]+$/);

    // Check for signature status card
    await expect(page.getByText('Signature client')).toBeVisible();

    // Click generate signature link button
    const signatureLinkButton = page.getByRole('button', { name: /Générer lien de signature/i });
    if (await signatureLinkButton.isVisible()) {
      await signatureLinkButton.click();

      // Wait for modal to appear
      await expect(page.getByText('Lien de signature')).toBeVisible();
      await expect(page.getByText(/Le lien expire dans 24 heures/)).toBeVisible();

      // Get the signature URL from the modal
      const urlElement = page.locator('.font-mono');
      const signatureUrl = await urlElement.textContent();

      // Close modal
      await page.getByRole('button', { name: 'Fermer' }).click();

      // Now test the public signature page (in a new context to avoid auth)
      if (signatureUrl) {
        const signaturePath = signatureUrl.replace(/^https?:\/\/[^/]+/, '');

        // Create new browser context without auth
        const newContext = await page.context().browser()!.newContext();
        const publicPage = await newContext.newPage();

        await publicPage.goto(`${BASE_URL}${signaturePath}`);

        // Check the signature page loads with order recap
        await expect(publicPage.getByText('Bon de commande')).toBeVisible();
        await expect(publicPage.getByText('Récapitulatif du service')).toBeVisible();
        await expect(publicPage.getByRole('heading', { name: 'Client', exact: true })).toBeVisible();
        await expect(publicPage.getByRole('heading', { name: 'Exploitant' })).toBeVisible();
        await expect(publicPage.getByRole('heading', { name: 'Signature du client' })).toBeVisible();
        await expect(publicPage.getByText('Signez ici')).toBeVisible();

        // Check submit button is disabled until signature is drawn
        const submitButton = publicPage.getByRole('button', { name: /Confirmer et signer/i });
        await expect(submitButton).toBeDisabled();

        console.log('✓ Signature link generated and public page accessible');

        await newContext.close();
      }
    } else {
      // Order already signed
      await expect(page.getByText(/Signé le/)).toBeVisible();
      console.log('✓ Order already signed');
    }
  });
});
