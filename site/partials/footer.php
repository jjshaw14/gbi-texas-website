<?php
/**
 * Shared site footer + video modal + script tag.
 *
 * Included by every page via:
 *   <?php include $_SERVER['DOCUMENT_ROOT'] . '/partials/footer.php'; ?>
 *
 * All paths inside are ABSOLUTE (start with "/") so they resolve correctly
 * regardless of which page is doing the including.
 */
?>
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/index.php" aria-label="Great Basin Industrial Austin, Home">
          <img class="brand-logo" src="/assets/images/atx/GBIATXWhitecopy.png" alt="Great Basin Industrial Austin" style="height:48px;" />
        </a>
        <ul class="footer-tagline" aria-label="Driven, Building, Excellence, Together"><li>Driven</li><li>Building</li><li>Excellence</li><li>Together</li></ul>
        <p>Commercial electrical contractor serving the Austin, TX market for over 30 years. New construction, tenant finish-out, and critical facilities electrical work, self-performed by licensed Master Electricians.</p>
      </div>
      <div>
        <h5>About</h5>
        <ul>
          <li><a href="/about/our-story.php">Our Story</a></li>
          <li><a href="/about/leadership.php">Management Team</a></li>
          <li><a href="/about/sales.php">Sales</a></li>
          <li><a href="/about/experience.php">Experience</a></li>
          <li><a href="/about/locations.php">Locations</a></li>
        </ul>
      </div>
      <div>
        <h5>Services</h5>
        <ul>
          <li><a href="/services/new-construction.php">New Construction</a></li>
          <li><a href="/services/commercial-construction.php">Commercial Construction</a></li>
          <li><a href="/services/critical-facilities.php">Critical Facilities</a></li>
        </ul>
      </div>
      <div>
        <h5>Projects</h5>
        <ul>
          <li><a href="/projects/index.php">New Construction</a></li>
          <li><a href="/projects/index.php">Commercial Construction</a></li>
          <li><a href="/projects/index.php">Critical Facilities</a></li>
        </ul>
      </div>
      <div>
        <h5>Connect</h5>
        <ul>
          <li><a href="/about/safety-quality.php">Safety &amp; Quality</a></li>
          <li><a href="/careers.php">Careers</a></li>
          <li><a href="/contact.php">Contact</a></li>
          <li><a href="https://www.linkedin.com/company/great-basin-industrial/" target="_blank" rel="noopener">LinkedIn &#8599;</a></li>
        </ul>
      </div>
    </div>
    <p style="font-size:11px; color:rgba(255,255,255,.5); margin:0 0 16px; max-width:70ch;">TECL #30911 &mdash; Regulated by the Texas Department of Licensing and Regulation, P.O. Box 12157, Austin, TX 78711. Toll Free: 800-803-9202 &middot; Local: 512-463-6599 &middot; <a href="https://www.tdlr.texas.gov" target="_blank" rel="noopener" style="color:rgba(255,255,255,.6);">www.tdlr.texas.gov</a></p>
    <div class="footer-bottom">
      <div>&copy; 2026 GBI Austin &middot; Great Basin Industrial &middot; 16813 Calply Dr, Round Rock, TX 78664 &middot; (512) 643-2015</div>
      <div class="legal">
        <a href="https://www.tdlr.texas.gov" target="_blank" rel="noopener">TDLR &#8599;</a><a href="/terms.php">Terms</a>
      </div>
    </div>
  </div>
</footer>

<!-- Slide-out drawer: Start a Project + Contact forms. Opened by any [data-drawer-open]
     trigger, or by loading a page with #start-a-project / #contact-us in the URL.
     data-endpoint empty = preview mode (nothing is sent). Set it to a form URL at go-live. -->
<div class="drawer" data-drawer-root data-endpoint="" hidden aria-hidden="true">
  <div class="drawer-backdrop" data-drawer-close></div>
  <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1">
    <header class="drawer-head">
      <button type="button" class="drawer-close" data-drawer-close aria-label="Close panel">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <h2 id="drawer-title" class="drawer-title">Start a Project</h2>
      <p class="drawer-sub" data-drawer-sub>Tell us about your project. We&rsquo;ll tell you how we&rsquo;d build it.</p>
      <div class="drawer-tabs" role="tablist" aria-label="Choose a form">
        <button type="button" role="tab" id="tab-project" class="drawer-tab" data-drawer-tab="project" aria-controls="panel-project" aria-selected="true">Start a Project</button>
        <button type="button" role="tab" id="tab-contact" class="drawer-tab" data-drawer-tab="contact" aria-controls="panel-contact" aria-selected="false" tabindex="-1">Contact Us</button>
      </div>
    </header>

    <div class="drawer-body">
      <p class="drawer-preview" data-drawer-preview><strong>Preview.</strong> This form isn&rsquo;t connected yet, so nothing is sent.</p>

      <form class="drawer-form" id="panel-project" role="tabpanel" aria-labelledby="tab-project" data-form="project" novalidate>
        <div class="field"><label for="dp-name">Name <span class="req" aria-hidden="true">*</span></label><input id="dp-name" name="name" type="text" autocomplete="name" required /></div>
        <div class="field"><label for="dp-company">Company <span class="req" aria-hidden="true">*</span></label><input id="dp-company" name="company" type="text" autocomplete="organization" required /></div>
        <div class="field"><label for="dp-email">Email <span class="req" aria-hidden="true">*</span></label><input id="dp-email" name="email" type="email" autocomplete="email" required /></div>
        <div class="field"><label for="dp-phone">Phone</label><input id="dp-phone" name="phone" type="tel" autocomplete="tel" /></div>
        <div class="field full"><label for="dp-type">Project type <span class="req" aria-hidden="true">*</span></label>
          <select id="dp-type" name="project_type" required>
            <option value="">Select one</option>
            <option>New Construction</option>
            <option>Commercial Construction</option>
            <option>Critical Facilities</option>
            <option>Maintenance &amp; Repair</option>
            <option>Design-Build</option>
            <option>Not sure yet</option>
          </select>
        </div>
        <div class="field"><label for="dp-location">Project location</label><input id="dp-location" name="location" type="text" placeholder="City or address" /></div>
        <div class="field"><label for="dp-timeline">Bid date or timeline</label><input id="dp-timeline" name="timeline" type="text" placeholder="e.g. bids due Mar 14" /></div>
        <div class="field full"><label for="dp-desc">About the project <span class="req" aria-hidden="true">*</span></label><textarea id="dp-desc" name="description" required placeholder="Scope, square footage, GC, anything that helps us price it right."></textarea></div>
        <div class="drawer-actions full">
          <button type="submit" class="btn btn-primary">Send Project Details <span class="arr">&rarr;</span></button>
          <span class="drawer-note"><span class="req" aria-hidden="true">*</span> Required</span>
        </div>
      </form>

      <form class="drawer-form" id="panel-contact" role="tabpanel" aria-labelledby="tab-contact" data-form="contact" novalidate hidden>
        <div class="field"><label for="dc-name">Name <span class="req" aria-hidden="true">*</span></label><input id="dc-name" name="name" type="text" autocomplete="name" required /></div>
        <div class="field"><label for="dc-email">Email <span class="req" aria-hidden="true">*</span></label><input id="dc-email" name="email" type="email" autocomplete="email" required /></div>
        <div class="field"><label for="dc-phone">Phone</label><input id="dc-phone" name="phone" type="tel" autocomplete="tel" /></div>
        <div class="field"><label for="dc-topic">Topic</label>
          <select id="dc-topic" name="topic">
            <option>Bidding &amp; sales</option>
            <option>Employment</option>
            <option>Facilities &amp; locations</option>
            <option>Something else</option>
          </select>
        </div>
        <div class="field full"><label for="dc-msg">Message <span class="req" aria-hidden="true">*</span></label><textarea id="dc-msg" name="message" required></textarea></div>
        <div class="drawer-actions full">
          <button type="submit" class="btn btn-primary">Send Message <span class="arr">&rarr;</span></button>
          <span class="drawer-note"><span class="req" aria-hidden="true">*</span> Required</span>
        </div>
        <div class="drawer-direct full">
          <span>Prefer to talk?</span>
          <a href="tel:5126432015">(512) 643-2015</a>
          <span class="drawer-addr">16813 Calply Dr., Round Rock, TX 78664</span>
        </div>
      </form>

      <div class="form-done" data-form-done hidden tabindex="-1">
        <div class="form-done-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
        <h3 data-form-done-title>Thanks.</h3>
        <p data-form-done-text></p>
        <button type="button" class="btn btn-outline" data-drawer-close>Close</button>
      </div>
    </div>
  </aside>
</div>

<!-- Global video modal — opens when any .video-trigger is clicked -->
<div class="video-modal" data-video-modal hidden aria-hidden="true" role="dialog" aria-modal="true" aria-label="Video">
  <div class="video-modal-backdrop" data-video-close></div>
  <div class="video-modal-content" role="document">
    <button type="button" class="video-modal-close" data-video-close aria-label="Close video">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="22" height="22"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="video-modal-frame" data-video-frame>
      <!-- iframe injected at open -->
    </div>
  </div>
</div>

<!-- review:start -->
<script src="/assets/js/review-items.js" defer></script>
<script src="/assets/js/review.js" defer></script>
<!-- review:end -->
<script src="/assets/js/site.js"></script>
