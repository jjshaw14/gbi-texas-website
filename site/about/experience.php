<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Experience, Great Basin Industrial Austin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/styles.css" />
</head>
<body>

<header class="site-header is-dark">
  <div class="container nav-row">
    <a class="brand" href="../index.php" aria-label="Great Basin Industrial Austin, Home">
      <img class="brand-logo" src="../assets/images/atx/GBIATXWhitecopy.png" alt="Great Basin Industrial Austin" />
    </a>
    <nav class="primary-nav" aria-label="Primary">
      <div class="nav-item has-dropdown">
        <a href="our-story.php" class="nav-parent is-active" aria-haspopup="true" aria-expanded="false">About <span class="caret">▾</span></a>
        <div class="nav-dropdown" role="menu">
          <a href="our-story.php" class="dd-overview" role="menuitem"><strong>Our Story</strong><span>Founded 2015. 30+ years serving the Austin electrical market.</span></a>
          <a href="leadership.php" role="menuitem"><strong>Management Team</strong><span>Master Electricians who came up through the trade.</span></a>
          <a href="sales.php" role="menuitem"><strong>Sales</strong><span>Estimators who've worked the field, not just the plans.</span></a>
          <a href="experience.php" role="menuitem"><strong>Experience</strong><span>Full-scope electrical capability, turnkey to trade partner.</span></a>
          <a href="locations.php" role="menuitem"><strong>Locations</strong><span>GBI offices across the western U.S.</span></a>
        </div>
      </div>
      <div class="nav-item has-dropdown">
        <a href="../services/index.php" class="nav-parent" aria-haspopup="true" aria-expanded="false">Services <span class="caret">▾</span></a>
        <div class="nav-dropdown" role="menu">
          <a href="../services/index.php" class="dd-overview" role="menuitem"><strong>All Services</strong><span>Commercial electrical construction, self-performed start to finish.</span></a>
          <a href="../services/new-construction.php" role="menuitem"><strong>New Construction</strong><span>Shell buildings, tilt-wall, auto dealerships, medical buildings.</span></a>
          <a href="../services/critical-facilities.php" role="menuitem"><strong>Critical Facilities &amp; Data Centers</strong><span>PDUs, UPS systems, generators, surgery and imaging centers.</span></a>
          <a href="../services/tenant-finish-out.php" role="menuitem"><strong>Commercial Tenant Finish-Out</strong><span>High-end finish-outs, manufacturing, hospitality, retail.</span></a>
        </div>
      </div>
      <div class="nav-item has-dropdown">
        <a href="../projects/index.php" class="nav-parent" aria-haspopup="true" aria-expanded="false">Projects <span class="caret">▾</span></a>
        <div class="nav-dropdown" role="menu">
          <a href="../projects/index.php" class="dd-overview" role="menuitem"><strong>All Projects</strong><span>Recent work across the Austin market.</span></a>
          <a href="../projects/index.php#new-construction" role="menuitem"><strong>New Construction</strong><span>Ground-up shell buildings and tenant finish projects.</span></a>
          <a href="../projects/index.php#commercial-construction" role="menuitem"><strong>Commercial Construction</strong><span>Retail, hospitality, and tenant build-outs.</span></a>
          <a href="../projects/index.php#critical-facilities" role="menuitem"><strong>Critical Facilities</strong><span>Data centers, medical imaging, and critical power.</span></a>
        </div>
      </div>
      <a href="safety-quality.php">Safety &amp; Quality</a>
      <a href="../careers.php">Careers</a>
    </nav>
    <div class="nav-spacer"></div>
    <a class="nav-cta" href="../contact.php">Contact Us →</a>
    <button class="nav-mobile" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
</header>

<section class="hero hero-sm">
  <div class="hero-media" style="background-image:url('../assets/images/atx/LStar-Imaging-Center-Front-View1170x432.jpg')"></div>
  <div class="hero-overlay"></div>
  <div class="container">
    <div class="crumbs"><a href="../index.php">Home</a><span>/</span><a href="our-story.php">About</a><span>/</span>Experience</div>
    <span class="eyebrow on-dark">About / Experience</span>
    <h1>Full-Scope Electrical Capability.</h1>
    <p class="hero-sub">We pride ourselves on building and maintaining long-term relationships with our customers by providing superior customer service, on every job, every time.</p>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">What We Bring</span>
      <h2>Product, Delivery, and Industry Knowledge.</h2>
    </div>
    <div class="cap-card-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="cap-card">
        <h3>Product Expertise</h3>
        <p>GBI Austin offers a full range of electrical construction capability. From commercial to industrial, data centers to tenant improvements, GBI covers the full scope of your electrical needs.</p>
      </div>
      <div class="cap-card">
        <h3>Turnkey Services</h3>
        <p>GBI works closely with owners' engineers, general contractors, and architects to provide turnkey solutions: design and engineering, electrical maintenance and repairs, and complete installations.</p>
      </div>
      <div class="cap-card">
        <h3>Industry Knowledge</h3>
        <p>GBI Austin and its seasoned employees have a successful track record completing projects across multiple electrical sectors for many of the world's leading companies and general contractors.</p>
      </div>
    </div>
  </div>
</section>

<section class="final-cta">
  <div class="container">
    <span class="eyebrow on-dark">Ready to Build Something?</span>
    <h2>Tell us about your project. We'll tell you how we'd wire it.</h2>
    <div class="actions">
      <a class="btn btn-lime" href="../contact.php">Start a Project <span class="arr">→</span></a>
      <a class="btn btn-ghost" href="../contact.php">Contact Us <span class="arr">→</span></a>
    </div>
  </div>
</section>

<?php include $_SERVER['DOCUMENT_ROOT'] . '/partials/footer.php'; ?>
</body>
</html>
