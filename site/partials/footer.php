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

<script src="/assets/js/site.js"></script>
