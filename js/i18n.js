/* =======================================================
   Eva Apartman — i18n Language Switcher (EN / HR)
   Reads / writes preference to localStorage('eva-lang')
   Default language: English
   ======================================================= */
(function () {
  'use strict';

  var LANG_KEY = 'eva-lang';

  /* ── Translation dictionary ─────────────────────────── */
  var T = {

    en: {
      /* ── Navbar ──────────────────────────────────────── */
      'nav.home':     'Home',
      'nav.gallery':  'Gallery',
      'nav.location': 'Location',
      'nav.book':     'Book Now',

      /* ── Footer (shared) ─────────────────────────────── */
      'footer.desc.index':    'A charming holiday apartment in Kućište on the Pelješac peninsula — your home away from home between Orebić and Viganj.',
      'footer.desc.gallery':  'A charming holiday apartment on the Adriatic coast — your home away from home.',
      'footer.desc.location': 'A charming holiday apartment in Kućište on the Pelješac peninsula — your home away from home between Orebić and Viganj.',
      'footer.desc.contact':  'A charming holiday apartment in Kućište on the Pelješac peninsula — your home away from home between Orebić and Viganj.',
      'footer.quicklinks':    'Quick Links',
      'footer.apartment':     'The Apartment',
      'footer.contact':       'Contact',
      'footer.home':          'Home',
      'footer.location-area': 'Location & Area',
      'footer.book':          'Book Now',
      'footer.contact-us':    'Contact Us',
      'footer.about':         'About',
      'footer.gallery':       'Gallery',
      'footer.availability':  'Availability',
      'footer.interior':      'Interior',
      'footer.terrace':       'Terrace & Views',
      'footer.beach':         'Beach & Area',

      /* ── INDEX ───────────────────────────────────────── */
      'index.title':            'Eva Apartman – Your Coastal Retreat',
      'index.hero.badge':       'Adriatic Coast · Croatia',
      'index.hero.h1':          'Your Premier Apartment in Orebić & Pelješac',
      'index.hero.subtitle':    'Experience the ultimate family holiday on the Adriatic Coast. Nestled between the charm of Orebić and the breeze of Viganj, our apartments offer a serene coastal escape in the heart of Kućište.',
      'index.hero.btn.book':    'Book Your Stay',
      'index.hero.btn.explore': 'Explore the Region',
      'index.feat.heading':     'Top-Rated Accommodation in Pelješac',
      'index.feat.subtext':     'Everything for your Pelješac getaway: Modern apartment comfort in Kućište, located perfectly between the historic streets of Orebić and the beaches of Viganj.',
      'index.feat1.title':      'Steps from the Adriatic',
      'index.feat1.desc':       'Just a short walk from the pristine beaches of Kućište and crystal-clear coves.',
      'index.feat2.title':      'Modern Family Comfort',
      'index.feat2.desc':       'Fully equipped with AC and Wi-Fi, perfect for a stress-free family holiday.',
      'index.feat3.title':      'Free Private Parking',
      'index.feat3.desc':       'Secure, on-site parking in Kućište, making day trips to Orebić easy.',
      'index.feat4.title':      'Orebić Dining & Wine',
      'index.feat4.desc':       'Walking distance to the best seafood and traditional grill houses in the region.',
      'index.about.heading':    'Experience the Best of Viganj and Orebić',
      'index.about.p1':         'Eva Apartman is a beautifully appointed holiday apartment in Pelješac, designed to give you the freedom and comfort needed for an unforgettable Adriatic holiday. Perfectly situated in Kućište, our home offers a peaceful retreat just a stone\'s throw from the vibrant windsurfing scene of Viganj and the historic charm of Orebić.',
      'index.about.p2':         'The apartment features a bright, open-plan living and dining area, a fully equipped modern kitchen, a spacious bedroom, and a private bathroom. Step out onto your private terrace to breathe in the fresh sea air of the Pelješac coast while enjoying your morning coffee with views of the crystal-clear water.',
      'index.about.p3':         'Whether you are seeking a family holiday in Kućište, a romantic getaway near Orebić, or a solo adventure exploring the Pelješac wine roads, Eva Apartman provides the perfect base. Experience the best of the Croatian coast with all the modern amenities of a true home away from home.',
      'index.stat.bedrooms':    'Bedrooms',
      'index.stat.guests':      'Max Guests',
      'index.stat.area':        'Floor Area',
      'index.about.btn':        'Book Your Apartment',
      'index.gallery.heading':  'Explore Eva Apartman & the Pelješac Coast',
      'index.gallery.subtext':  'View our gallery to see why we are the top choice for an apartment in the Orebić area. Explore our spacious living areas and the peaceful Kućište neighborhood that makes every stay unforgettable.',
      'index.gallery.btn':      'See Full Gallery — 39 Photos',
      'index.reviews.heading':  'What Guests Love About Eva Apartman',
      'index.reviews.subtext':  'Verified reviews — every single guest has rated their family holiday experience a perfect 5 stars.',
      'index.reviews.score':    'Average Score',
      'index.cta.heading':      'Ready to Book Your Pelješac Getaway?',
      'index.cta.subtext':      'Check available dates for our apartment in Kućište and send us your inquiry — we\'ll help you plan the perfect stay near Orebić and Viganj within 24 hours.',
      'index.cta.btn.check':    'Check Apartment Dates',
      'index.cta.btn.see':      'See Nearby Attractions',

      /* ── Review texts ────────────────────────────────── */
      'index.rev1.text': 'Best apartment in Croatia. If you visit Pelješac, you should stay here. Great location, best view in a peaceful neighbourhood, close to the sea with umbrella and sunbeds.',
      'index.rev2.text': 'Beautiful apartment created with big heart by the Owner with amazing view on the sea and Korčula, very clean, near a great beach with private umbrella and sunbeds! I highly recommend it!!!',
      'index.rev3.text': 'Very nice and clean apartment, right by the sea with free parking.',
      'index.rev4.text': 'I recommend it — very comfortable apartment, terrace with a wonderful view of Korčula and one of the friendliest hosts we\'ve stayed with (delicious fig cake). Greetings to Ewa and her family! 😉',
      'index.rev5.text': 'Beautiful newly renovated apartment. Full praise to the hosts — we will definitely see each other again.',
      'index.rev6.text': 'Thank you for the wonderful holiday — we look forward to the next time! 💓',
      'index.rev7.text': 'I will be back someday.',

      /* ── GALLERY ─────────────────────────────────────── */
      'gallery.title':          'Photo Gallery – Eva Apartman',
      'gallery.breadcrumb':     'Gallery',
      'gallery.header.h1':      'Photo Gallery: Our Kućište Apartment & Pelješac View',
      'gallery.header.p':       'Browse 39 images of your next family holiday home. From our peaceful terrace views to the crystal-clear Adriatic waters just steps from your door in Kućište.',
      'gallery.tab.interior':   'Interior',
      'gallery.tab.terrace':    'Terrace & Views',
      'gallery.tab.beach':      'Beach & Area',
      'gallery.int.h2':         'Interior',
      'gallery.int.p':          'Light-filled, modern rooms designed for comfort and a genuine home-away-from-home feeling.',
      'gallery.int.count':      '31 photos',
      'gallery.ter.h2':         'Terrace & Views',
      'gallery.ter.p':          'Step outside to your private terrace — sunrise coffee, golden hour dinners, and uninterrupted sea air.',
      'gallery.ter.count':      '6 photos',
      'gallery.bea.h2':         'Beach & Area',
      'gallery.bea.p':          'Crystal-clear Adriatic water, pebble coves, and the wild beauty of Pelješac — all right on your doorstep.',
      'gallery.bea.count':      '2 photos',
      'gallery.cta.heading':    'Seen Enough? Come Stay.',
      'gallery.cta.p':          'Check available dates and send your enquiry — we\'ll get back to you within 24 hours.',
      'gallery.cta.btn.book':   'Check Availability & Book',
      'gallery.cta.btn.area':   'Explore the Area',

      /* ── LOCATION ────────────────────────────────────── */
      'location.title':         'Location & Area – Eva Apartman, Kućište, Pelješac',
      'location.breadcrumb':    'Location & Area',
      'location.header.h1':     'Kućište, Pelješac Peninsula',
      'location.header.p':      'Nestled in the quiet village of Kućište between Orebić and Viganj — a minute\'s walk from the sea, with Korčula island visible across the channel and world-class windsurfing just down the road.',
      'location.map.h2':        'Find Us on the Map',
      'location.getting.h3':    'Getting Here',
      'location.by.car':        '<strong>By Car:</strong> Arriving at your apartment in Kućište is easier than ever via the new Pelješac Bridge. From the A1 motorway, take the D414 exit and enjoy a scenic drive through Ston and Orebić to reach us. Free private parking is included for all guests.',
      'location.by.ferry1':     '<strong>By Ferry — Orebić ↔ Korčula:</strong> The Orebić car ferry to Korčula Town is just an 8-min drive from our door. This 15-minute crossing is perfect for a family holiday day trip to the islands.',
      'location.by.ferry2':     '<strong>By Ferry — Ploče ↔ Trpanj:</strong> Alternatively, take the Ploče–Trpanj ferry (60 min crossing) for a relaxing shortcut to the Pelješac peninsula, followed by a 35-minute drive to Kućište.',
      'location.airports':      '<strong>Nearest Airports:</strong> Most guests arrive via Dubrovnik (approx. 2h) or Split (approx. 1h 45m). Both airports offer easy access to the Pelješac peninsula via well-maintained coastal roads.',
      'location.dist.h3':       'Distances at a Glance',
      'location.dist1':         'Kućište pebble beach — <strong>1 min walk</strong>',
      'location.dist2':         'Seaside Konobas & Restaurants — <strong>6 min walk</strong>',
      'location.dist3':         'Viganj Windsurfing & Kite Centers — <strong>5 min drive</strong>',
      'location.dist4':         'Orebić Town, Shops & Supermarkets — <strong>6 min drive</strong>',
      'location.dist5':         'Orebić Ferry to Korčula Island — <strong>6 min drive</strong>',
      'location.dist6':         'Ston Walls & Pelješac Vineyards — <strong>35 min drive</strong>',
      'location.dist7':         'Split / Dubrovnik International Airports — <strong>~1 h 45 min / 2 h</strong>',
      'location.dist.btn':      'Check Dates & Book',
      'location.beaches.h2':    'Top Beaches in Kućište & Orebić',
      'location.beaches.p':     'The Pelješac peninsula is home to some of the finest shores on the Adriatic coast, from surf spots to sandy coves.',
      'location.b1.title':      'Perna Beach',
      'location.b1.desc':       'Steps away from your apartment, offering sunbeds and calm morning waters.',
      'location.b1.dist':       '1 min walk',
      'location.b2.title':      'Kućište Bay',
      'location.b2.desc':       'Discover peaceful pebble coves and crystal-clear turquoise waters along the Kućište promenade.',
      'location.b2.dist':       '5 min drive',
      'location.b3.title':      'Trstenica Beach (Orebić)',
      'location.b3.desc':       'Explore the long pebble and sand stretches of Orebić, just a quick 6-minute drive away.',
      'location.b3.dist':       '6 min drive',
      'location.rest.h2':       'Pelješac Dining & Local Cuisine',
      'location.rest.p':        'From authentic Kućište konobas to the vibrant Orebić restaurant scene and breezy Viganj beach bars, discover the flavors of the Adriatic coast.',
      'location.r1.title':      'Kućište Waterfront Konobas',
      'location.r1.desc':       'Traditional family taverns steps from our apartment. Enjoy fresh grilled fish and local Plavac Mali wine—the highlight of any Pelješac holiday.',
      'location.r1.dist':       '5 min drive',
      'location.r2.title':      'Orebić Dining Experience',
      'location.r2.desc':       'The widest choice on the peninsula. Seafood restaurants and pizzerias line the palm-shaded promenade, perfect for a relaxing family holiday dinner.',
      'location.r2.dist':       '8 min drive',
      'location.r3.title':      'Viganj Beach Bars',
      'location.r3.desc':       'Popular with the international crowd, these bars offer cold drinks and live music with iconic sunsets over the Pelješac channel.',
      'location.r3.dist':       '7 min drive',
      'location.attr.h2':       'Unforgettable Pelješac Experiences',
      'location.attr.p':        'History, wine, adventure, and island-hopping — the Pelješac peninsula packs an extraordinary amount into a small space near your Kućište apartment.',
      'location.a1.title':      'Viganj Windsurfing & Watersports',
      'location.a1.desc':       'One of Europe\'s top windsurfing destinations. From our location in Kućište, you are minutes away from schools catering to all levels, chasing the famous maestral wind.',
      'location.a1.dist':       '7 min drive',
      'location.a2.title':      'Island Hopping to Korčula',
      'location.a2.desc':       'Drive 8 minutes to the Orebić ferry port and reach Korčula Town in 15 minutes. Explore the medieval walls and historic charm of this world-famous island.',
      'location.a2.dist':       '8 min drive + 15 min ferry',
      'location.a3.title':      'Ston & The Great Wall of Croatia',
      'location.a3.desc':       'A 35-minute drive takes you to Europe\'s longest defensive wall. Climb for panoramic Pelješac views, then sample Ston\'s world-famous fresh oysters and mussels.',
      'location.a3.dist':       '35 min drive',
      'location.a4.title':      'Pelješac Wine Route & Dingač',
      'location.a4.desc':       'Explore Croatia\'s finest red-wine region. From your base in Kućište, visit family-run cellars and taste bold Plavac Mali wines just a short drive away.',
      'location.a4.dist':       '20 min drive',
      'location.a5.title':      'Orebić Promenade & Monastery',
      'location.a5.desc':       'Stroll the historic Orebić waterfront and hike to the 15th-century Franciscan Monastery. It is the most picturesque landmark near our Pelješac apartment.',
      'location.a5.dist':       '8 min drive',
      'location.a6.title':      'Sveti Ilija Peak',
      'location.a6.desc':       'The highest point on the Pelješac peninsula. The trail from Orebić offers panoramic views of the Adriatic, Korčula, and Viganj, perfect for an active family holiday adventure.',
      'location.a6.dist':       '10 min drive to trailhead',
      'location.cta.h2':        'Your Kućište Escape Awaits',
      'location.cta.p':         'Just steps from the Adriatic sea, minutes from the Orebić ferry to Korčula, and surrounded by the best of the Pelješac peninsula. Check our availability and secure your holiday apartment today.',
      'location.cta.btn.book':  'Book Your Pelješac Stay',
      'location.cta.btn.home':  'Back to Home',

      /* ── CONTACT ─────────────────────────────────────── */
      'contact.title':          'Book Your Stay – Eva Apartman',
      'contact.breadcrumb':     'Book Your Stay',
      'contact.header.h1':      'Secure Your Dates on the Pelješac Coast',
      'contact.header.p':       'Select your preferred dates for a Pelješac getaway. Fill in your details below, and we will confirm your family holiday reservation within 24 hours.',
      'contact.panel.h3':       'Get in Touch',
      'contact.panel.p':        'Have questions before booking? We\'re happy to help.',
      'contact.phone.lbl':      'Phone / WhatsApp',
      'contact.email.lbl':      'Email',
      'contact.addr.lbl':       'Address',
      'contact.how.h4':         'How Booking Works',
      'contact.step1':          'Pick your dates on the calendar',
      'contact.step2':          'Fill in your details and submit',
      'contact.step3':          'We\'ll confirm availability within 24\u00a0h',
      'contact.step4':          'Arrange payment and check-in details',
      'contact.season.lbl':     'Season:',
      'contact.season.val':     'May – October',
      'contact.min.lbl':        'Min. stay:',
      'contact.min.val':        '3 nights',
      'contact.checkin.lbl':    'Check-in:',
      'contact.checkin.val':    '14:00 – 20:00',
      'contact.checkout.lbl':   'Check-out:',
      'contact.checkout.val':   'by 10:00',
      'contact.form.h2':        'Send a Booking Enquiry',
      'contact.form.req':       'All fields marked <span style="color:var(--color-accent);">*</span> are required.',
      'contact.fname.lbl':      'First Name',
      'contact.fname.ph':       'e.g. Ana',
      'contact.lname.lbl':      'Last Name',
      'contact.lname.ph':       'e.g. Horvat',
      'contact.email.fld':      'Email Address',
      'contact.email.opt':      '(optional — for our reply)',
      'contact.email.ph':       'e.g. ana.horvat@email.com',
      'contact.guests.lbl':     'Number of Guests',
      'contact.guests.def':     '— Select number of guests —',
      'contact.guests.1':       '1 guest',
      'contact.guests.2':       '2 guests',
      'contact.guests.3':       '3 guests',
      'contact.guests.4':       '4 guests',
      'contact.guests.5':       '5 guests',
      'contact.guests.6':       '6 guests',
      'contact.guests.7':       '7 guests',
      'contact.guests.8':       '8 guests',
      'contact.dates.lbl':      'Stay Dates',
      'contact.cal.instr':      'Click a <strong style="color:var(--cal-available);">green date</strong> to set check-in, then click another green date to set check-out. Both dates must be green and no booked or off-season days may fall between them.',
      'contact.leg.avail':      'Available',
      'contact.leg.booked':     'Already booked',
      'contact.leg.off':        'Off-season (closed)',
      'contact.cal.checkin':    'Check-in',
      'contact.cal.checkout':   'Check-out',
      'contact.cal.nosel':      'Not selected',
      'contact.msg.lbl':        'Additional Message or Questions',
      'contact.msg.ph':         'Any special requests, questions, or information you\'d like us to know…',
      'contact.submit.btn':     'Send Booking Enquiry',
      'contact.submit.note':    'We\'ll respond within 24 hours. Your data is used only to process your enquiry.',
      'contact.success.h3':     'Enquiry Sent!',
      'contact.success.p':      'Thank you for your interest in Eva Apartman.<br>We\'ll be in touch within 24 hours to confirm your booking.',
      'contact.success.btn':    'Back to Home',
    },

    hr: {
      /* ── Navbar ──────────────────────────────────────── */
      'nav.home':     'Početna',
      'nav.gallery':  'Galerija',
      'nav.location': 'Lokacija',
      'nav.book':     'Rezervirajte',

      /* ── Footer (shared) ─────────────────────────────── */
      'footer.desc.index':    'Šarmantan apartman za odmor u Kućištu na poluotoku Pelješac — vaš dom daleko od kuće između Orebića i Vignja.',
      'footer.desc.gallery':  'Šarmantan apartman za odmor na jadranskoj obali — vaš dom daleko od kuće.',
      'footer.desc.location': 'Šarmantan apartman za odmor u Kućištu na poluotoku Pelješac — vaš dom daleko od kuće između Orebića i Vignja.',
      'footer.desc.contact':  'Šarmantan apartman za odmor u Kućištu na poluotoku Pelješac — vaš dom daleko od kuće između Orebića i Vignja.',
      'footer.quicklinks':    'Brze poveznice',
      'footer.apartment':     'Apartman',
      'footer.contact':       'Kontakt',
      'footer.home':          'Početna',
      'footer.location-area': 'Lokacija i okolica',
      'footer.book':          'Rezervirajte',
      'footer.contact-us':    'Kontaktirajte nas',
      'footer.about':         'O apartmanu',
      'footer.gallery':       'Galerija',
      'footer.availability':  'Dostupnost',
      'footer.interior':      'Unutarnji prostori',
      'footer.terrace':       'Terasa i pogledi',
      'footer.beach':         'Plaža i okolica',

      /* ── INDEX ───────────────────────────────────────── */
      'index.title':            'Eva Apartman – Vaš odmor na obali',
      'index.hero.badge':       'Jadranska obala · Hrvatska',
      'index.hero.h1':          'Vrhunski apartman u Orebiću i na Pelješcu',
      'index.hero.subtitle':    'Doživite savršen obiteljski odmor na jadranskoj obali. Smješten između šarma Orebića i povjetarca Vignja, naš apartman nudi miran obalni bijeg u srcu Kućišta.',
      'index.hero.btn.book':    'Rezervirajte boravak',
      'index.hero.btn.explore': 'Istražite regiju',
      'index.feat.heading':     'Najpopularniji smještaj na Pelješcu',
      'index.feat.subtext':     'Sve za vaš pelješki odmor: moderan komfor u Kućištu, savršeno smještenom između povijesnih ulica Orebića i plaža Vignja.',
      'index.feat1.title':      'Koraci od Jadrana',
      'index.feat1.desc':       'Kratka šetnja do netaknutih plaža Kućišta i kristalno čistih uvala.',
      'index.feat2.title':      'Moderan obiteljski komfor',
      'index.feat2.desc':       'Potpuno opremljen s klima-uređajem i Wi-Fijem, idealan za obiteljski odmor bez stresa.',
      'index.feat3.title':      'Besplatno privatno parkiranje',
      'index.feat3.desc':       'Sigurno, privatno parkiranje u Kućištu, što olakšava izlete u Orebić.',
      'index.feat4.title':      'Gastro ponuda Orebića',
      'index.feat4.desc':       'U pješačkoj udaljenosti od najboljeg ribarskog restorana i tradicionalnih konoba u regiji.',
      'index.about.heading':    'Doživite najbolje od Vignja i Orebića',
      'index.about.p1':         'Eva Apartman je lijepo uređen apartman za odmor na Pelješcu, dizajniran kako bi vam pružio slobodu i komfor potrebne za nezaboravan jadranski odmor. Savršeno smješten u Kućištu, naš dom nudi mirno utočište tik uz živopisnu surfovačku scenu Vignja i povijesni šarm Orebića.',
      'index.about.p2':         'Apartman ima svijetli dnevni boravak otvorenog tlocrta, potpuno opremljenu modernu kuhinju, prostornu spavaću sobu i privatnu kupaonicu. Izađite na privatnu terasu i udahnite svježi morski zrak pelješačke obale uz jutarnju kavu s pogledom na kristalno bistru vodu.',
      'index.about.p3':         'Bez obzira tražite li obiteljski odmor u Kućištu, romantičan bijeg u blizini Orebića ili solo avanturu istraživanjem peljeških vinskih cesta, Eva Apartman pruža savršenu bazu. Doživite ono najbolje od hrvatske obale uz sve moderne pogodnosti pravog doma daleko od kuće.',
      'index.stat.bedrooms':    'Spavaće sobe',
      'index.stat.guests':      'Maks. gostiju',
      'index.stat.area':        'Stambena površina',
      'index.about.btn':        'Rezervirajte apartman',
      'index.gallery.heading':  'Istražite Eva Apartman i pelješačku obalu',
      'index.gallery.subtext':  'Pogledajte našu galeriju i uvjerite se zašto smo prvi izbor za apartman u okolici Orebića. Istražite naše prostrane prostorije i mirno Kućište koje svaki boravak čini nezaboravnim.',
      'index.gallery.btn':      'Cijela galerija — 39 fotografija',
      'index.reviews.heading':  'Što gosti vole kod Eve Apartmana',
      'index.reviews.subtext':  'Provjerene recenzije — svaki gost ocijenio je obiteljski odmor savršenom ocjenom 5 zvjezdica.',
      'index.reviews.score':    'Prosječna ocjena',
      'index.cta.heading':      'Spremni za pelješki odmor?',
      'index.cta.subtext':      'Provjerite slobodne termine za naš apartman u Kućištu i pošaljite upit — pomoći ćemo vam planirati savršen boravak uz Orebić i Viganj u roku od 24 sata.',
      'index.cta.btn.check':    'Provjeri slobodne termine',
      'index.cta.btn.see':      'Vidi obližnje atrakcije',

      /* ── Review texts ────────────────────────────────── */
      'index.rev1.text': 'Najbolji apartman u Hrvatskoj. Ako posjetite Pelješac, svakako tu odsjednite. Odlična lokacija, najljepši pogled u mirnom susjedstvu, blizu mora s suncobranima i ležaljkama.',
      'index.rev2.text': 'Prekrasan apartman stvoren s puno ljubavi od strane vlasnice, s nevjerojatnim pogledom na more i Korčulu, jako čist, blizu odlične plaže s privatnim suncobranima i ležaljkama! Toplo preporučujem!!!',
      'index.rev3.text': 'Jako lijep i čist apartman, odmah pokraj mora s besplatnim parkingom.',
      'index.rev4.text': 'Preporučujem — jako ugodan apartman, terasa s predivnim pogledom na Korčulu i jedni od najljubaznijih domaćina kod kojih smo boravili (odlični kolač od smokava). Pozdrav Evi i njezinoj obitelji! 😉',
      'index.rev5.text': 'Prekrasan novo uređeni apartman. Svaka pohvala domaćinima, u svakom slučaju vidimo se ponovno.',
      'index.rev6.text': 'Hvala za predivan odmor — jedva čekamo sljedeći put! 💓',
      'index.rev7.text': 'Jednog dana ću se vratiti.',

      /* ── GALLERY ─────────────────────────────────────── */
      'gallery.title':          'Foto galerija – Eva Apartman',
      'gallery.breadcrumb':     'Galerija',
      'gallery.header.h1':      'Foto galerija: Naš apartman u Kućištu i pogled na Pelješac',
      'gallery.header.p':       'Pregledajte 39 fotografija vašeg sljedećeg obiteljskog doma za odmor. Od naših mirnih terasa do kristalno čistih jadranskih voda pred vratima u Kućištu.',
      'gallery.tab.interior':   'Unutarnji prostori',
      'gallery.tab.terrace':    'Terasa i pogledi',
      'gallery.tab.beach':      'Plaža i okolica',
      'gallery.int.h2':         'Unutarnji prostori',
      'gallery.int.p':          'Svijetle, moderne prostorije dizajnirane za komfor i osjećaj pravog doma daleko od kuće.',
      'gallery.int.count':      '31 fotografija',
      'gallery.ter.h2':         'Terasa i pogledi',
      'gallery.ter.p':          'Izađite na privatnu terasu — jutarnja kava uz izlazak sunca, večere u zlatnom satu i neometani morski zrak.',
      'gallery.ter.count':      '6 fotografija',
      'gallery.bea.h2':         'Plaža i okolica',
      'gallery.bea.p':          'Kristalno čista jadranska voda, šljunčane uvale i divlja ljepota Pelješca — sve na dohvat ruke.',
      'gallery.bea.count':      '2 fotografije',
      'gallery.cta.heading':    'Vidjeli ste dovoljno? Dođite na odmor.',
      'gallery.cta.p':          'Provjerite slobodne termine i pošaljite upit — odgovoriti ćemo vam u roku od 24 sata.',
      'gallery.cta.btn.book':   'Provjeri dostupnost i rezerviraj',
      'gallery.cta.btn.area':   'Istražite okolicu',

      /* ── LOCATION ────────────────────────────────────── */
      'location.title':         'Lokacija i okolica – Eva Apartman, Kućište, Pelješac',
      'location.breadcrumb':    'Lokacija i okolica',
      'location.header.h1':     'Kućište, poluotok Pelješac',
      'location.header.p':      'Smješteno u mirnom selu Kućište između Orebića i Vignja — minutu hoda od mora, s pogledom na otok Korčulu i svjetski poznatim surfovanjem tik uz cestu.',
      'location.map.h2':        'Pronađite nas na karti',
      'location.getting.h3':    'Kako doći',
      'location.by.car':        '<strong>Automobilom:</strong> Dolazak do apartmana u Kućištu jednostavniji je nego ikad zahvaljujući novom Pelješkom mostu. S autoceste A1, skrenite na D414 i uživajte u vožnji kroz Ston i Orebić do nas. Besplatno privatno parkiranje uključeno je za sve goste.',
      'location.by.ferry1':     '<strong>Trajektom — Orebić ↔ Korčula:</strong> Trajekt za automobile od Orebića do Korčule je samo 8 minuta vožnje od nas. Prelazak traje 15 minuta i savršen je za obiteljski izlet na otoke.',
      'location.by.ferry2':     '<strong>Trajektom — Ploče ↔ Trpanj:</strong> Kao alternativa, uzmite trajekt Ploče–Trpanj (60 min) za opuštenu prečicu do poluotoka Pelješac, a zatim 35 minuta vožnje do Kućišta.',
      'location.airports':      '<strong>Najbliže zrakoplovne luke:</strong> Većina gostiju stiže iz Dubrovnika (oko 2 h) ili Splita (oko 1 h 45 min). Obje luke nude jednostavan pristup poluotoku Pelješac dobro održavanim obalnim cestama.',
      'location.dist.h3':       'Udaljenosti na prvi pogled',
      'location.dist1':         'Šljunčana plaža Kućište — <strong>1 min hoda</strong>',
      'location.dist2':         'Primorske konobe i restorani — <strong>6 min hoda</strong>',
      'location.dist3':         'Surfovački i kite centri u Vignju — <strong>5 min vožnje</strong>',
      'location.dist4':         'Grad Orebić, trgovine i supermarketi — <strong>6 min vožnje</strong>',
      'location.dist5':         'Trajekt iz Orebića na Korčulu — <strong>6 min vožnje</strong>',
      'location.dist6':         'Stonske zidine i pelješki vinogradi — <strong>35 min vožnje</strong>',
      'location.dist7':         'Zrakoplovne luke Split/Dubrovnik — <strong>~1 h 45 min / 2 h</strong>',
      'location.dist.btn':      'Provjeri termine i rezerviraj',
      'location.beaches.h2':    'Najljepše plaže u Kućištu i Orebiću',
      'location.beaches.p':     'Poluotok Pelješac dom je nekih od najljepših obala na Jadranu, od surfovačkih točaka do pješčanih uvala.',
      'location.b1.title':      'Plaža Perna',
      'location.b1.desc':       'Tik uz apartman, s ležaljkama i mirnom jutarnjom vodom.',
      'location.b1.dist':       '1 min hoda',
      'location.b2.title':      'Uvala Kućište',
      'location.b2.desc':       'Otkrijte mirne šljunčane uvale i kristalno bistru tirkiznu vodu duž kućišanske šetnice.',
      'location.b2.dist':       '5 min vožnje',
      'location.b3.title':      'Plaža Trstenica (Orebić)',
      'location.b3.desc':       'Istražite dugačke šljunčane i pješčane površine Orebića, samo 6 minuta vožnje.',
      'location.b3.dist':       '6 min vožnje',
      'location.rest.h2':       'Gastronomska ponuda Pelješca i lokalna kuhinja',
      'location.rest.p':        'Od autentičnih kućiških konoba do živopisnih orebićkih restorana i opuštenih viganjskih beach barova — otkrijte okuse jadranske obale.',
      'location.r1.title':      'Primorske konobe Kućišta',
      'location.r1.desc':       'Tradicionalne obiteljske konobe tik uz naš apartman. Uživajte u svježe pečenoj ribi i lokalnom vinu Plavac Mali — vrhunac svakog pelješkog odmora.',
      'location.r1.dist':       '5 min vožnje',
      'location.r2.title':      'Gastronomska scena Orebića',
      'location.r2.desc':       'Najveći izbor na poluotoku. Ribarski restorani i pizzerije duž palmama osjenjene šetnice, savršeni za opuštenu obiteljsku večeru.',
      'location.r2.dist':       '8 min vožnje',
      'location.r3.title':      'Beach barovi Vignja',
      'location.r3.desc':       'Popularni kod internacionalne publike, ovi barovi nude hladna pića i live glazbu uz ikonske zalaze sunca nad pelješkim kanalom.',
      'location.r3.dist':       '7 min vožnje',
      'location.attr.h2':       'Nezaboravna iskustva Pelješca',
      'location.attr.p':        'Povijest, vino, avantura i otočni izleti — poluotok Pelješac nudi nevjerojatno puno sadržaja u blizini vašeg kućiškog apartmana.',
      'location.a1.title':      'Jedrenje na dasci i vodni sportovi u Vignju',
      'location.a1.desc':       'Jedno od najboljih europskih odredišta za jedrenje na dasci. Iz Kućišta ste minutama udaljeni od škola za sve razine koje love poznati maestral.',
      'location.a1.dist':       '7 min vožnje',
      'location.a2.title':      'Otočni izleti na Korčulu',
      'location.a2.desc':       'Vozite 8 minuta do trajektne luke u Orebiću i za 15 minuta stignete u Korčulu. Istražite srednjovjekovne zidine i povijesni šarm ovog svjetski poznatog otoka.',
      'location.a2.dist':       '8 min vožnje + 15 min trajektom',
      'location.a3.title':      'Ston i Veliki zid Hrvatske',
      'location.a3.desc':       'Vožnja od 35 minuta dovodi vas do najduljeg obrambenog zida u Europi. Popnite se za panoramski pogled na Pelješac, a zatim probajte stonske svježe kamenice i dagnje.',
      'location.a3.dist':       '35 min vožnje',
      'location.a4.title':      'Pelješka vinska cesta i Dingač',
      'location.a4.desc':       'Istražite najfinije crnovinska područja Hrvatske. Iz Kućišta posjetite obiteljske podrume i kušajte snažna vina Plavac Mali na kratkoj vožnji.',
      'location.a4.dist':       '20 min vožnje',
      'location.a5.title':      'Orebićka šetnica i Franjevački samostan',
      'location.a5.desc':       'Prošetajte povijesnim orebićkim pristaništem i pješačite do Franjevačkog samostana iz 15. stoljeća — najslikovitijeg mjesta u blizini našeg pelješkog apartmana.',
      'location.a5.dist':       '8 min vožnje',
      'location.a6.title':      'Vrh Sveti Ilija',
      'location.a6.desc':       'Najviša točka poluotoka Pelješca. Staza iz Orebića nudi panoramske poglede na Jadran, Korčulu i Viganj — savršena avantura za aktivne goste.',
      'location.a6.dist':       '10 min vožnje do polazišta',
      'location.cta.h2':        'Vaš odmor u Kućištu čeka vas',
      'location.cta.p':         'Tik uz Jadransko more, minutama od trajekta iz Orebića na Korčulu i okruženi najboljim što Pelješac nudi. Provjerite dostupnost i osigurajte apartman za odmor danas.',
      'location.cta.btn.book':  'Rezervirajte pelješki boravak',
      'location.cta.btn.home':  'Natrag na početnu',

      /* ── CONTACT ─────────────────────────────────────── */
      'contact.title':          'Rezervirajte boravak – Eva Apartman',
      'contact.breadcrumb':     'Rezervirajte boravak',
      'contact.header.h1':      'Osigurajte termine na pelješačkoj obali',
      'contact.header.p':       'Odaberite željene termine za pelješki odmor. Ispunite podatke u nastavku, a mi ćemo potvrditi rezervaciju obiteljskog odmora u roku od 24 sata.',
      'contact.panel.h3':       'Stupite u kontakt',
      'contact.panel.p':        'Imate pitanja prije rezervacije? Rado ćemo vam pomoći.',
      'contact.phone.lbl':      'Telefon / WhatsApp',
      'contact.email.lbl':      'E-pošta',
      'contact.addr.lbl':       'Adresa',
      'contact.how.h4':         'Kako funkcionira rezervacija',
      'contact.step1':          'Odaberite termine na kalendaru',
      'contact.step2':          'Ispunite podatke i pošaljite',
      'contact.step3':          'Potvrdimo dostupnost u roku od 24\u00a0h',
      'contact.step4':          'Dogovorimo plaćanje i detalje prijave',
      'contact.season.lbl':     'Sezona:',
      'contact.season.val':     'Svibanj – Listopad',
      'contact.min.lbl':        'Min. boravak:',
      'contact.min.val':        '3 noći',
      'contact.checkin.lbl':    'Prijava:',
      'contact.checkin.val':    '14:00 – 20:00',
      'contact.checkout.lbl':   'Odjava:',
      'contact.checkout.val':   'do 10:00',
      'contact.form.h2':        'Pošaljite upit za rezervaciju',
      'contact.form.req':       'Sva polja označena <span style="color:var(--color-accent);">*</span> su obavezna.',
      'contact.fname.lbl':      'Ime',
      'contact.fname.ph':       'npr. Ana',
      'contact.lname.lbl':      'Prezime',
      'contact.lname.ph':       'npr. Horvat',
      'contact.email.fld':      'E-mail adresa',
      'contact.email.opt':      '(nije obavezno — za naš odgovor)',
      'contact.email.ph':       'npr. ana.horvat@email.com',
      'contact.guests.lbl':     'Broj gostiju',
      'contact.guests.def':     '— Odaberite broj gostiju —',
      'contact.guests.1':       '1 gost',
      'contact.guests.2':       '2 gosta',
      'contact.guests.3':       '3 gosta',
      'contact.guests.4':       '4 gosta',
      'contact.guests.5':       '5 gostiju',
      'contact.guests.6':       '6 gostiju',
      'contact.guests.7':       '7 gostiju',
      'contact.guests.8':       '8 gostiju',
      'contact.dates.lbl':      'Datumi boravka',
      'contact.cal.instr':      'Kliknite na <strong style="color:var(--cal-available);">zeleni datum</strong> za odabir prijave, zatim kliknite drugi zeleni datum za odabir odjave. Oba datuma moraju biti zelena i između njih ne smiju biti zauzeti ili van-sezonski dani.',
      'contact.leg.avail':      'Slobodno',
      'contact.leg.booked':     'Već rezervirano',
      'contact.leg.off':        'Van sezone (zatvoreno)',
      'contact.cal.checkin':    'Prijava',
      'contact.cal.checkout':   'Odjava',
      'contact.cal.nosel':      'Nije odabrano',
      'contact.msg.lbl':        'Dodatna poruka ili pitanja',
      'contact.msg.ph':         'Posebni zahtjevi, pitanja ili informacije koje biste željeli podijeliti s nama…',
      'contact.submit.btn':     'Pošalji upit za rezervaciju',
      'contact.submit.note':    'Odgovoriti ćemo u roku od 24 sata. Vaši podaci koriste se isključivo za obradu upita.',
      'contact.success.h3':     'Upit poslan!',
      'contact.success.p':      'Hvala na interesu za Eva Apartman.<br>Javit ćemo se u roku od 24 sata radi potvrde rezervacije.',
      'contact.success.btn':    'Natrag na početnu',
    }
  };

  /* ── Helpers ────────────────────────────────────────── */
  function getLang() {
    return localStorage.getItem(LANG_KEY) || 'en';
  }

  function setLang(lang) {
    localStorage.setItem(LANG_KEY, lang);
  }

  function detectPage() {
    var p = window.location.pathname.toLowerCase();
    if (p.indexOf('gallery')  !== -1) return 'gallery';
    if (p.indexOf('location') !== -1) return 'location';
    if (p.indexOf('contact')  !== -1) return 'contact';
    return 'index';
  }

  /* ── Apply translations ─────────────────────────────── */
  function applyLang(lang) {
    var t   = T[lang] || T.en;
    var page = detectPage();

    /* html[lang] attribute + class */
    document.documentElement.lang = lang;
    document.documentElement.classList.remove('lang-en', 'lang-hr');
    document.documentElement.classList.add('lang-' + lang);

    /* document.title */
    var titleKey = page + '.title';
    if (t[titleKey]) document.title = t[titleKey];

    /* [data-i18n] → textContent */
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });

    /* [data-i18n-html] → innerHTML */
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    /* [data-i18n-placeholder] → placeholder */
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) el.placeholder = t[key];
    });

    /* lang-toggle active state */
    var btn = document.getElementById('lang-toggle');
    if (btn) {
      var enSpan = btn.querySelector('.lt-en');
      var hrSpan = btn.querySelector('.lt-hr');
      if (enSpan) enSpan.classList.toggle('lt-active', lang === 'en');
      if (hrSpan) hrSpan.classList.toggle('lt-active', lang === 'hr');
    }
  }

  /* ── Toggle handler ─────────────────────────────────── */
  function toggleLang() {
    var next = getLang() === 'en' ? 'hr' : 'en';
    setLang(next);
    applyLang(next);
  }

  /* ── Init ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.addEventListener('click', toggleLang);
    applyLang(getLang());
  });

})();
