<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Contact, Great Basin Industrial Austin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/styles.css" />
<link rel="stylesheet" href="assets/css/theme-atx.css" />
<link rel="icon" type="image/png" href="assets/images/favicon.png" />
</head>
<body>

<header class="site-header is-dark">
  <div class="container nav-row">
    <a class="brand" href="index.php" aria-label="Great Basin Industrial Austin, Home">
      <img class="brand-logo" src="assets/images/atx/GBIATXWhitecopy.png" alt="Great Basin Industrial Austin" />
    </a>
    <nav class="primary-nav" aria-label="Primary">
      <div class="nav-item has-dropdown">
        <a href="about/our-story.php" class="nav-parent " aria-haspopup="true" aria-expanded="false">About <span class="caret">▾</span></a>
        <div class="nav-dropdown" role="menu">
          <a href="about/our-story.php" class="dd-overview" role="menuitem"><strong>Our Story</strong><span>Founded 2015. 30+ years serving the Austin electrical market.</span></a>
          <a href="about/leadership.php" role="menuitem"><strong>Management Team</strong><span>Master Electricians who came up through the trade.</span></a>
          <a href="about/sales.php" role="menuitem"><strong>Sales</strong><span>Estimators who've worked the field, not just the plans.</span></a>
          <a href="about/experience.php" role="menuitem"><strong>Experience</strong><span>Full-scope electrical capability, turnkey to trade partner.</span></a>
          <a href="about/locations.php" role="menuitem"><strong>Locations</strong><span>Rooted in Austin. Backed by GBI.</span></a>
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <a href="services/index.php" class="nav-parent " aria-haspopup="true" aria-expanded="false">Services <span class="caret">▾</span></a>
        <div class="nav-dropdown" role="menu">
          <a href="services/index.php" class="dd-overview" role="menuitem"><strong>All Services</strong><span>Commercial electrical construction, self-performed start to finish.</span></a>
          <a href="services/new-construction.php" role="menuitem"><strong>New Construction</strong><span>Shell buildings, tilt-wall, auto dealerships, medical buildings.</span></a>
          <a href="services/commercial-construction.php" role="menuitem"><strong>Commercial Construction</strong><span>High-end finish-outs, manufacturing, hospitality, retail.</span></a>
          <a href="services/critical-facilities.php" role="menuitem"><strong>Critical Facilities</strong><span>PDUs, UPS systems, generators, surgery and imaging centers.</span></a>
        </div>
      </div>

      <div class="nav-item has-dropdown">
        <a href="projects/index.php" class="nav-parent " aria-haspopup="true" aria-expanded="false">Projects <span class="caret">▾</span></a>
        <div class="nav-dropdown" role="menu">
          <a href="projects/index.php" class="dd-overview" role="menuitem"><strong>All Projects</strong><span>Recent work across the Austin market.</span></a>
          <a href="projects/index.php#new-construction" role="menuitem"><strong>New Construction</strong><span>Ground-up shell buildings and tenant finish projects.</span></a>
          <a href="projects/index.php#commercial-construction" role="menuitem"><strong>Commercial Construction</strong><span>Retail, hospitality, and tenant build-outs.</span></a>
          <a href="projects/index.php#critical-facilities" role="menuitem"><strong>Critical Facilities</strong><span>Data centers, medical imaging, and critical power.</span></a>
        </div>
      </div>

      <a href="about/safety-quality.php" class="">Safety &amp; Quality</a>
      <a href="careers.php" class="">Careers</a>
    </nav>
    <div class="nav-spacer"></div>
    <a class="nav-cta" href="contact.php">Contact Us →</a>
    <button class="nav-mobile" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>

<section class="hero hero-sm">
  <div class="hero-media" style="background-image:url('assets/images/hero-contact.jpg')"></div>
  <div class="hero-overlay"></div>
  <div class="container">
    <div class="crumbs"><a href="index.php">Home</a><span>/</span>Contact</div>
    <span class="eyebrow on-dark">Contact</span>
    <h1>Let&rsquo;s Talk.</h1>
    <p class="hero-sub">Whether you have a project to bid, a question about our capabilities, or want to connect with our team &mdash; we&rsquo;re easy to reach, and we respond quickly.</p>
  </div>
</section>

<section id="start-a-project">
  <div class="container two-col">
    <div style="background:var(--gbi-offwhite); padding:32px; border:1px solid var(--rule);">
      <span class="eyebrow">Start a Project</span>
      <form class="form-grid" onsubmit="return false;" style="margin-top:20px;">
        <div class="field"><label for="sp-first">First Name</label><input id="sp-first" type="text" /></div>
        <div class="field"><label for="sp-last">Last Name</label><input id="sp-last" type="text" /></div>
        <div class="field"><label for="sp-company">Company</label><input id="sp-company" type="text" /></div>
        <div class="field"><label for="sp-title">Title</label><input id="sp-title" type="text" /></div>
        <div class="field"><label for="sp-phone">Phone</label><input id="sp-phone" type="tel" /></div>
        <div class="field"><label for="sp-email">Email</label><input id="sp-email" type="email" /></div>
        <div class="field full"><label for="sp-location">Project Location</label><input id="sp-location" type="text" /></div>
        <div class="field full"><label for="sp-type">Project Type</label>
          <select id="sp-type">
            <option>New Construction</option>
            <option>Commercial</option>
            <option>Critical Facilities</option>
            <option>Maintenance &amp; Repair</option>
            <option>Design-Build</option>
            <option>Not Sure</option>
          </select>
        </div>
        <div class="field full"><label for="sp-desc">Project Description</label><textarea id="sp-desc"></textarea></div>
        <div class="field full"><label for="sp-hear">How did you hear about us?</label><input id="sp-hear" type="text" /></div>
        <div class="full"><button type="submit" class="btn btn-primary">Submit <span class="arr">→</span></button></div>
      </form>
    </div>
    <div>
      <span class="eyebrow">Reach Our Team</span>
      <h2>GBI Austin &mdash; Texas Electrical Division</h2>
      <div style="margin-top:24px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:1.1rem; font-weight:600;">16813 Calply Dr., Round Rock, TX 78664</div>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); font-weight:700;">Main</div>
          <a href="tel:5126432015" style="font-size:1.1rem; font-weight:600;">(512) 643-2015</a>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); font-weight:700;">Bidding &amp; Project Inquiries</div>
          <a href="mailto:sales@gbiatx.com" style="font-size:1.1rem; font-weight:600;">sales@gbiatx.com</a>
        </div>
        <div style="margin-bottom:14px;">
          <div style="font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); font-weight:700;">Careers</div>
          <a href="mailto:careers@gbiatx.com" style="font-size:1.1rem; font-weight:600;">careers@gbiatx.com</a>
        </div>
        <p style="font-size:.9rem; color:var(--muted);">TECL #30911 &mdash; Regulated by the Texas Department of Licensing and Regulation, P.O. Box 12157, Austin, TX 78711 &mdash; <a href="tel:8008039202">(800) 803-9202</a></p>
      </div>
    </div>
  </div>
</section>

<section id="facilities" class="bg-offwhite">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Facilities</span>
      <h2>Service, Maintenance &amp; Repairs.</h2>
      <p class="lead">Already have a GBI-built facility, or need a licensed electrical partner to keep one running? Our facilities team handles maintenance, repairs, and upgrades &mdash; including live and critical environments.</p>
    </div>
    <p style="font-size:1.1rem;"><strong>Facilities &amp; Service:</strong> <a href="tel:5126432015" style="font-weight:600;">(512) 643-2015</a></p>
  </div>
</section>

<section id="sales">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Sales</span>
      <h2>Bidding a Project?</h2>
      <p class="lead">Send us the plans or the scope and we&rsquo;ll get you a number grounded in real field experience.</p>
    </div>
    <p style="font-size:1.1rem;"><strong>Bidding &amp; Project Inquiries:</strong> <a href="mailto:sales@gbiatx.com" style="font-weight:600;">sales@gbiatx.com</a> &nbsp;|&nbsp; <a href="tel:5126432015" style="font-weight:600;">(512) 643-2015</a></p>
  </div>
</section>

<section id="employment" class="bg-offwhite">
  <div class="container two-col">
    <div>
      <span class="eyebrow">Employment</span>
      <h2>Join a Team Built by Electricians.</h2>
      <p class="lead">We&rsquo;re always looking for electricians, foremen, and project managers who take pride in the work. If you&rsquo;ve done it right and want to keep getting better, we want to hear from you.</p>
      <div style="margin-top:24px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); font-weight:700;">Careers</div>
          <a href="mailto:careers@gbiatx.com" style="font-size:1.1rem; font-weight:600;">careers@gbiatx.com</a>
        </div>
        <div>
          <div style="font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:var(--muted); font-weight:700;">Careers &mdash; Apprentice Electricians</div>
          <a href="https://apply.teamengine.io/apply/XT0kMIn2z2Hw/B" target="_blank" rel="noopener" style="font-size:1.1rem; font-weight:600;">Apply Online</a>
          <div style="margin-top:4px;">Or text <strong>"apply"</strong> to <a href="sms:4356605841" style="font-weight:600;">(435) 660-5841</a></div>
        </div>
      </div>
    </div>
    <div style="background:var(--white); padding:32px; border:1px solid var(--rule);">
      <form class="form-grid" onsubmit="return false;">
        <div class="field full"><label for="em-name">Name</label><input id="em-name" type="text" /></div>
        <div class="field"><label for="em-phone">Phone</label><input id="em-phone" type="tel" /></div>
        <div class="field"><label for="em-email">Email</label><input id="em-email" type="email" /></div>
        <div class="field full"><label for="em-position">Position of Interest</label><input id="em-position" type="text" /></div>
        <div class="field"><label for="em-years">Years of Experience</label><input id="em-years" type="text" /></div>
        <div class="field"><label for="em-license">License</label><input id="em-license" type="text" /></div>
        <div class="field full"><label for="em-resume">Upload Resume</label><input id="em-resume" type="file" /></div>
        <div class="full"><button type="submit" class="btn btn-primary">Submit <span class="arr">→</span></button></div>
      </form>
    </div>
  </div>
</section>

<section class="cta-split">
  <div class="cta-split-text">
    <span class="eyebrow on-dark">Ready to Build Something?</span>
    <h2>Tell us about your project. We'll tell you how we'd build it.</h2>
    <div class="actions">
      <a class="btn btn-lime" href="contact.php">Start a Project <span class="arr">→</span></a>
      <a class="btn btn-ghost" href="contact.php">Contact Us <span class="arr">→</span></a>
    </div>
  </div>
  <div class="cta-split-photo" style="background-image:url('assets/images/atx/projects/tab/TABPic21200wx800h-1024x683.png')"></div>
</section>

<?php include $_SERVER['DOCUMENT_ROOT'] . '/partials/footer.php'; ?>
</body>
</html>
