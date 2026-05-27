(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var burger = document.querySelector(".site-header__burger");
  var mobileNav = document.getElementById("site-nav-mobile");
  var leadForm = document.getElementById("lead-form");

  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  function closeMobileNav() {
    if (!burger || !mobileNav) return;
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openMobileNav() {
    burger.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  if (burger && mobileNav) {
    burger.addEventListener("click", function () {
      if (mobileNav.classList.contains("is-open")) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMobileNav);
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      var target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      closeMobileNav();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (leadForm) {
    leadForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!leadForm.checkValidity()) {
        leadForm.reportValidity();
        return;
      }

      alert("Заявка сохранена. Напишите нам в Telegram или WhatsApp.");
      leadForm.reset();
    });
  }
})();
