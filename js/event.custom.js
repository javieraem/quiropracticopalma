(function () {
  "use strict";

  var navbar = document.querySelector(".navbar-sticky");
  var backToTop = document.querySelector("#back-to-top");
  var heroVideo = document.querySelector(".hero-video");
  var aboutImageFrame = document.querySelector("#about .content-img");
  var aboutImage = document.querySelector("#about .about-image-motion");
  var speakerCards = Array.prototype.slice.call(document.querySelectorAll(".speaker-card"));
  var parallaxSections = Array.prototype.slice.call(
    document.querySelectorAll(".parallax-overlay.bg-parallax")
  );
  var revealSelectors = [
    ".hero-title-line",
    ".hero-btn",
    "section h2",
    "section h3",
    "section h4",
    "section h5",
    "section p",
    "section .lead",
    "section .btn",
    ".stat-icon",
    ".display-4",
    ".parallax-overlay .display-4",
    ".parallax-overlay .h4",
    ".parallax-overlay h2",
    ".parallax-overlay .lead",
    ".parallax-overlay .btn",
    ".footer h4",
    ".footer p",
    ".footer .btn",
    ".footer span"
  ].join(",");
  var revealItems = Array.prototype.slice.call(document.querySelectorAll(revealSelectors)).filter(function (item) {
    return !item.closest(".team-detail");
  });
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ticking = false;
  var headerTone = "";

  document.documentElement.classList.add("loaded");

  if (heroVideo) {
    heroVideo.playbackRate = 0.7;
  }

  function getBackgroundTone(element) {
    var current = element;

    while (current && current !== document.documentElement) {
      if (current.closest && current.closest("#home, .parallax-overlay, #testimonios, .footer")) {
        return "dark";
      }

      var bg = window.getComputedStyle(current).backgroundColor;
      var match = bg && bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?/);

      if (match) {
        var alpha = match[4] === undefined ? 1 : Number(match[4]);

        if (alpha > 0.45) {
          var brightness = (Number(match[1]) * 299 + Number(match[2]) * 587 + Number(match[3]) * 114) / 1000;

          if (brightness < 150) {
            return "dark";
          }

          if (brightness > 190) {
            return "light";
          }
        }
      }

      current = current.parentElement;
    }

    return "";
  }

  function getToneAtPoint(x, y) {
    var stack = document.elementsFromPoint(x, y);

    for (var i = 0; i < stack.length; i += 1) {
      if (!navbar.contains(stack[i])) {
        return getBackgroundTone(stack[i]);
      }
    }

    return "";
  }

  function getProbePoints() {
    var points = [];
    var logo = navbar.querySelector(".logo-first");
    var socials = navbar.querySelector(".header-socials");
    var navRect = navbar.getBoundingClientRect();
    var fallbackY = Math.min(window.innerHeight - 1, Math.max(42, navRect.bottom + 8));

    [logo, socials].forEach(function (item) {
      if (!item) {
        return;
      }

      var rect = item.getBoundingClientRect();

      if (rect.width && rect.height) {
        points.push({
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(Math.min(window.innerHeight - 1, Math.max(1, rect.top + rect.height / 2)))
        });
      }
    });

    points.push({
      x: Math.round(window.innerWidth / 2),
      y: Math.round(fallbackY)
    });

    return points;
  }

  function updateHeaderTone() {
    if (!navbar || !document.elementsFromPoint) {
      return;
    }

    var lightCount = 0;
    var darkCount = 0;

    getProbePoints().forEach(function (point) {
      var tone = getToneAtPoint(point.x, point.y);

      if (tone === "light") {
        lightCount += 1;
      }

      if (tone === "dark") {
        darkCount += 1;
      }
    });

    if (lightCount >= 2 && lightCount >= darkCount) {
      headerTone = "light";
    } else if (darkCount >= 2 && darkCount > lightCount) {
      headerTone = "dark";
    } else if (!headerTone) {
      headerTone = darkCount >= lightCount ? "dark" : "light";
    }

    navbar.classList.toggle("is-on-dark", headerTone !== "light");
    navbar.classList.toggle("is-on-light", headerTone === "light");
  }

  function updateScrollState() {
    var scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    var active = scrollY > 40;

    if (navbar) {
      navbar.classList.toggle("sticky-active", active);
      updateHeaderTone();
    }

    if (backToTop) {
      backToTop.classList.toggle("is-visible", scrollY > 500);
    }
  }

  function updateAboutImageMotion(viewportHeight) {
    if (!aboutImageFrame || !aboutImage) {
      return;
    }

    var rect = aboutImageFrame.getBoundingClientRect();

    if (rect.bottom < 0 || rect.top > viewportHeight) {
      return;
    }

    aboutImage.style.removeProperty("background-position");
  }

  function updateParallax() {
    if (reduceMotion) {
      ticking = false;
      return;
    }

    var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (window.innerWidth >= 768 && parallaxSections.length) {
      parallaxSections.forEach(function (section) {
        var rect = section.getBoundingClientRect();

        if (rect.bottom < 0 || rect.top > viewportHeight) {
          return;
        }

        var progress = (rect.top - viewportHeight / 2) * -0.08;
        section.style.backgroundPosition = "center calc(50% + " + progress.toFixed(1) + "px)";
      });
    }

    updateAboutImageMotion(viewportHeight);

    ticking = false;
  }

  function requestParallaxUpdate() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  function scrollToTarget(target) {
    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start"
    });
  }

  function setupRevealAnimations() {
    if (!revealItems.length) {
      return;
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var groupCounts = new WeakMap();

    revealItems.forEach(function (item) {
      var group = item.closest(".hero-inner, .center-title, .team-detail, .feature-box, .plan, .parallax-overlay, #about .col-lg-6, #ubicacion .row, .footer .row") || item.parentElement;
      var count = groupCounts.get(group) || 0;
      var inHero = !!item.closest("#home");
      var baseDelay = inHero ? 300 : 0;
      var delayStep = inHero ? 190 : 105;

      groupCounts.set(group, count + 1);
      item.style.setProperty("--reveal-delay", Math.min(baseDelay + count * delayStep, 780) + "ms");
      item.classList.add("reveal-init");
    });

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        }, {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px"
        });

        revealItems.forEach(function (item) {
          observer.observe(item);
        });
      });
    });
  }

  function setupCardInteractions() {
    if (!speakerCards.length) {
      return;
    }

    speakerCards.forEach(function (card) {
      card.addEventListener("pointerdown", function () {
        speakerCards.forEach(function (item) {
          if (item !== card) {
            item.classList.remove("is-touch-active");
          }
        });

        card.classList.toggle("is-touch-active");
      });

      card.addEventListener("mouseleave", function () {
        card.classList.remove("is-touch-active");
      });
    });
  }

  if (backToTop) {
    backToTop.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (event) {
      var href = anchor.getAttribute("href");

      if (!href || href === "#") {
        return;
      }

      if (anchor === backToTop) {
        return;
      }

      var target = document.querySelector(href);

      if (!target) {
        return;
      }

      event.preventDefault();
      scrollToTarget(target);
    });
  });

  updateScrollState();
  updateParallax();
  setupRevealAnimations();
  setupCardInteractions();

  function handleScrollUpdate() {
    updateScrollState();
    requestParallaxUpdate();
  }

  window.addEventListener("scroll", handleScrollUpdate, { passive: true });
  document.addEventListener("scroll", handleScrollUpdate, { passive: true, capture: true });

  window.addEventListener("resize", function () {
    updateHeaderTone();
    requestParallaxUpdate();
  });
})();
