// Wait until window is fully loaded and required elements are in DOM
window.addEventListener("load", () => {
  waitForElement(".outro", initXQuizPage);

  function waitForElement(selector, callback, timeout = 7000) {
    const start = Date.now();
    (function check() {
      const el = document.querySelector(selector);
      if (el) {
        callback();
      } else if (Date.now() - start < timeout) {
        requestAnimationFrame(check);
      } else {
        console.warn(`Element ${selector} not found after ${timeout}ms`);
      }
    })();
  }

  function initXQuizPage() {
    gsap.registerPlugin(ScrollTrigger);

    let lastScroll = window.scrollY;
    let ticking = false;

    const params = new URLSearchParams(window.location.search);
    const name = params.get("name");
    const email = params.get("email");
    const q1 = params.get("q1");
    const q2Raw = params.get("q2");
    const bundleKey = params.get("result") || "longevity";

    const bundleItemMap = {
      longevity: 1052,
      fuel: 958,
      gut: 824,
      xBundle: 566,
    };

    const headerEl = document.getElementById("intro-header");
    const bodyEl = document.getElementById("intro-body");
    const formattedQ2 = formatQ2Answers(q2Raw);

    if (name && q1 && q2Raw) {
      headerEl.textContent = `Congrats ${name}, on completing the X Quiz`;
      bodyEl.innerHTML = `Your focus on <strong>${q1}</strong> and your current challenges with ${formattedQ2} led us here. This plan was made to restore your energy, support your skin, and help you age on your terms.`;
    } else {
      headerEl.textContent = `Welcome to your personalized wellness path.`;
      bodyEl.textContent = `We’ve curated a premium product plan to help you feel more energized, supported, and in control — no matter where you’re starting from. Let’s make your next chapter your strongest one.`;
    }

    const shopLinkEl = document.querySelector(".sticky-cta a.main");
    if (shopLinkEl) {
      shopLinkEl.href = buildShoppingLink(bundleKey);
    }

    function formatQ2Answers(q2String) {
      if (!q2String) return "";
      const items = q2String.split(",").map((item) => item.trim()).filter(Boolean);
      if (items.length === 0) return "";
      if (items.length === 1) return `<strong>${items[0]}</strong>`;
      if (items.length === 2) return `<strong>${items[0]}</strong> and <strong>${items[1]}</strong>`;
      const allButLast = items.slice(0, -1).map((i) => `<strong>${i}</strong>`).join(", ");
      const last = `<strong>${items[items.length - 1]}</strong>`;
      return `${allButLast}, and ${last}`;
    }

    function buildShoppingLink(resultKey) {
      const alias = getWebAlias();
      const itemId = bundleItemMap[resultKey] || 1052;
      return `https://shop.xyngular.com/${alias}/Shopping/item?itemId=${itemId}&Flow=Shopping`;
    }

    function getWebAlias() {
      const hostname = window.location.hostname;
      const pathParts = window.location.pathname.split("/");
      if (hostname.includes("myxyngular.com") && pathParts.length > 2) {
        return pathParts[2];
      }
      return "corporphan";
    }

    function submitToHubSpot(email) {
  const submissionKey = `submitted_${email}`;
  if (localStorage.getItem(submissionKey)) {
    console.log("Email already submitted. Skipping...");
    return;
  }
  if (!email || !email.includes("@")) {
    console.warn("Invalid or missing email. Submission skipped.");
    return;
  }


  const resultUrl = window.location.href;
  const shoppingLink = buildShoppingLink(bundleKey);

  const data = {
    fields: [
      { name: "email", value: email },
      { name: "firstname", value: name || "" },
      { name: "quiz_result", value: bundleKey },
      { name: "quiz_referring_web_alias", value: getWebAlias() },
      { name: "quiz_shopping_link", value: shoppingLink },
    ],
    context: {
      pageUri: resultUrl,
      pageName: document.title,
    },
  };

  fetch(
    "https://api.hsforms.com/submissions/v3/integration/submit/4195958/a0c903a2-bdeb-41ea-82b4-93963ab68296",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  )
    .then((res) => {
      if (res.ok) {
        console.log("Submitted to HubSpot");
        localStorage.setItem(submissionKey, "true");
      } else {
        console.error("Submission error:", res.statusText);
      }
    })
    .catch((err) => console.error("Fetch error:", err));
}

    let formSubmitted = false;
    if (email && email.includes("@") && !formSubmitted) {
  submitToHubSpot(email);
  formSubmitted = true;
  console.log("We’ve sent your results to your inbox.");
}

    const emailBtn = document.getElementById("email-results-btn");
    if (emailBtn) {
      emailBtn.addEventListener("click", () => {
        if (email && formSubmitted) {
          showMessage("Looks like we already sent them!");
        } else if (!formSubmitted) {
          openEmailModal();
        }
      });
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    });

    function handleScroll() {
      const currentScroll = window.scrollY;
      if (currentScroll > lastScroll && currentScroll > 100) {
        gsap.to(".site-header", { y: "-100%", duration: 0.3, ease: "power2.out" });
      } else {
        gsap.to(".site-header", { y: "0%", duration: 0.3, ease: "power2.out" });
      }
      lastScroll = currentScroll;
      ticking = false;
    }

    const products = gsap.utils.toArray(".product");
    const buttons = gsap.utils.toArray(".product-bar button");
    let hasInitialized = false;

    gsap.matchMedia().add("(min-width: 800px)", () => {
      gsap.fromTo(".sticky-cta", { autoAlpha: 1 }, {
        autoAlpha: 0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".shop-link",
          start: "top 90%",
          end: "bottom 90%",
          toggleActions: "play reverse play reverse",
        },
      });

      gsap.to(".sticky-cta", {
        height: 100,
        boxShadow: "0 0px 20px rgba(253, 208, 111, 1)",
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".outro-text",
          start: "bottom 99%",
          endTrigger: ".results-page-container",
          end: "bottom bottom",
          toggleActions: "play complete none reverse",
          pinSpacing: false,
          markers: false,
        },
      });
    });

    products.forEach((product, index) => {
      ScrollTrigger.create({
        trigger: product,
        start: "left center",
        end: "center center",
        onEnter: () => activateTab(index),
        onEnterBack: () => activateTab(index > 0 ? index - 1 : 0),
        horizontal: true,
        scroller: "#productTrack",
      });
    });

    function activateTab(index, suppressScroll = false) {
      buttons.forEach((btn, i) => {
        btn.classList.toggle("active", i === index);
        if (i === index && !suppressScroll && hasInitialized) {
          btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      });
      const allDescriptions = document.querySelectorAll(".product-content");
      allDescriptions.forEach((desc) => desc.classList.remove("active"));

      const productId = buttons[index].dataset.id;
      const activeDesc = document.querySelector(`.product-content[data-id="${productId}"]`);
      if (activeDesc) activeDesc.classList.add("active");
    }

    buttons.forEach((button, i) => {
      button.addEventListener("click", () => {
        const target = products[i];
        const container = document.querySelector("#productTrack");
        const scrollLeft = target.offsetLeft - container.offsetWidth / 2 + target.offsetWidth / 2;

        gsap.to(container, {
          scrollLeft,
          duration: 0.6,
          ease: "power2.out",
        });

        activateTab(i);
      });
    });

    activateTab(0, true);
    hasInitialized = true;

    function openEmailModal() {
      alert("Enter your email in the modal here...");
    }

    function showMessage(msg) {
      alert(msg);
    }
  }
});
