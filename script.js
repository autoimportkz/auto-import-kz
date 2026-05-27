(function () {
  "use strict";

  const header = document.querySelector(".header");
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  const mainLeadForm = document.getElementById("main-lead-form");

  /* Scroll: header shadow */
  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Smooth scroll for data-scroll buttons and anchor links */
  document.querySelectorAll("[data-scroll], .mobile-menu a[href^='#']").forEach(function (el) {
    el.addEventListener("click", function (e) {
      const target =
        el.getAttribute("data-scroll") || el.getAttribute("href");
      if (!target || !target.startsWith("#")) return;

      const node = document.querySelector(target);
      if (!node) return;

      e.preventDefault();
      closeMobileMenu();
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* Mobile menu */
  function closeMobileMenu() {
    burger.classList.remove("active");
    burger.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("open");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  burger.addEventListener("click", function () {
    if (mobileMenu.classList.contains("open")) {
      closeMobileMenu();
    } else {
      burger.classList.add("active");
      burger.setAttribute("aria-expanded", "true");
      mobileMenu.classList.add("open");
      mobileMenu.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  });

  mobileMenu.querySelectorAll("a, button").forEach(function (link) {
    link.addEventListener("click", closeMobileMenu);
  });

  /* Lead form submit */
  if mainLeadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    if (!mainLeadForm.checkValidity()) {
    mainLeadForm.reportValidity();
    return;
    }
    
    const formData = {
    name: mainLeadForm.querySelector('[name="name"]').value,
    phone: mainLeadForm.querySelector('[name="phone"]').value,
    budget: mainLeadForm.querySelector('[name="budget"]').value,
    car: mainLeadForm.querySelector('[name="car"]').value,
    comment: mainLeadForm.querySelector('[name="comment"]').value
    };
    
    try {
    await fetch("https://script.google.com/macros/s/AKfycbwkDxNCLCagHmeVBINmFkhO6sWy-2W83dd1bPbyK8872k0qkkN0CNBF8aSh42X4q8rUEg/exec", {
    method: "POST",
    headers: {
    "Content-Type": "application/json"
    },
    body: JSON.stringify(formData)
    });
    
    ```
    alert("Заявка отправлена! Скоро мы с вами свяжемся.");
    mainLeadForm.reset();
    ```
    
    } catch (error) {
    alert("Ошибка отправки заявки");
    console.error(error);
    }
    });
    ;
    });
  }

  /* Intersection Observer: fade-in on scroll */
  const scrollEls = document.querySelectorAll(".fade-in-on-scroll");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    scrollEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    scrollEls.forEach(function (el) {
      el.classList.add("visible");
    });
  }
})();
