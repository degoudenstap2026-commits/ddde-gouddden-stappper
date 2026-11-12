DE GOUDEN STAP — CLOUD-ONLY OPSLAAN

BELANGRIJK
Deze versie gebruikt Supabase als enige plek voor het opslaan en laden van wijzigingen.
Er wordt geen localStorage/browserkopie meer gebruikt. De melding "Online opgeslagen"
verschijnt pas nadat Supabase de inhoud heeft opgeslagen én de inhoud daarna is teruggelezen.

BESTANDEN UPLOADEN
1. Upload alle bestanden uit deze map naar dezelfde map op je website.
2. Behoud supabase-config.js met jouw Project URL en public/anon key.
3. Upload ook product.html voor de aparte productpagina.
4. Vervang in elk geval app.js en admin.html door deze nieuwe versies.

SUPABASE EENMALIG INSTELLEN
1. Open Supabase > SQL Editor.
2. Voer het volledige bestand supabase-setup.sql uit.
3. Controleer bij Table Editor > site_content dat er een rij met id = 1 bestaat.
4. Maak via Authentication > Users een beheeraccount aan.
5. Open admin.html op je website en log in met dat beheeraccount.
6. Bij de eerste installatie worden de standaardgegevens uit data.json getoond.
   Klik op Opslaan. Daarna staat de actuele website-inhoud in Supabase.
7. Open de website op een andere computer en vernieuw de pagina.

AFBEELDINGEN
Afbeeldingen die via Beheer worden geüpload, komen in de publieke Supabase Storage-bucket
site-images. Het uploaden vereist een ingelogde beheerder.

ALS ANDERE COMPUTERS GEEN WIJZIGINGEN ZIEN
- Controleer of site_content > id 1 > content gevuld is.
- Controleer of de publieke SELECT-policy uit supabase-setup.sql bestaat.
- Controleer of alle pagina's dezelfde supabase-config.js en app.js gebruiken.
- Gebruik Ctrl+F5 (Windows) of Cmd+Shift+R (Mac) om cache te vernieuwen.

VEILIGHEID
Gebruik in supabase-config.js alleen de publishable/anon public key.
Plaats nooit een service_role- of secret key in websitebestanden.
