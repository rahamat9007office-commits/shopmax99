document.getElementById("shopmax99FooterYear").textContent =
        new Date().getFullYear();

      /* =========================================================
   SHOPMAX99 FOOTER ACTIONS
========================================================= */

      document.addEventListener("click", function (event) {
        const link = event.target.closest("[data-footer-action]");

        if (!link) return;

        event.preventDefault();

        const action = link.dataset.footerAction;

        /* CUSTOMER NAVIGATION */

        const customerSections = {
          home: "home",
          products: "products",
          cart: "cart",
          orders: "orders",
        };

        if (customerSections[action]) {
          if (typeof window.showCustomerSection === "function") {
            window.showCustomerSection(customerSections[action]);
          } else {
            console.warn(
              "ShopMax99: Customer navigation is currently unavailable.",
            );
          }

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          return;
        }

        /* SUPPORT AND POLICY PAGES */

        if (
          action === "help" ||
          action === "contact" ||
          action === "shipping" ||
          action === "returns" ||
          action === "privacy" ||
          action === "terms"
        ) {
          openShopMax99InfoPage(action);

          return;
        }

        /* SELLER */

        if (action === "seller-register") {
          if (window.ShopMax99?.maintenance?.isActive?.()) {
            window.ShopMax99.maintenance.apply("customer");
            return;
          }
          const registerModal = document.getElementById("sellerRegisterModal");
          if (registerModal) {
            registerModal.hidden = false;
            document.body.style.overflow = "hidden";
            setTimeout(() => document.getElementById("sellerRegisterForm")?.querySelector("input")?.focus(), 30);
          } else {
            alert("Seller registration is currently unavailable.");
          }
          return;
        }

        if (action === "seller-login") {
          openSellerLogin();

          return;
        }

        if (action === "master-login") {
          if (typeof window.openMasterLogin === "function") window.openMasterLogin();
          else alert("Master login is currently unavailable.");
          return;
        }

        if (action === "seller-terms") {
          openShopMax99InfoPage("seller-terms");

          return;
        }
      });

      window.closeMasterAndOpen = function (type) {
        const master = document.getElementById("masterLoginModal");
        if (master) master.hidden = true;
        document.body.style.overflow = "";
        if (type === "admin") {
          if (typeof window.openAdminLogin === "function") window.openAdminLogin();
          return;
        }
        if (typeof window.openSupportLogin === "function") window.openSupportLogin(type);
      };

      document.addEventListener("click", function (event) {
        const option = event.target.closest("[data-master-open]");
        if (!option) return;
        event.preventDefault();
        window.closeMasterAndOpen(option.dataset.masterOpen);
      });

      /* =========================================================
         MASTER PASSKEY GATE
         Static passkey requested for the prototype.
      ========================================================= */
      (function initMasterPasskeyGate() {
        const MASTER_PASSKEY = "9007102062";

        function openMasterPasskey() {
          const passkeyModal = document.getElementById("masterPasskeyModal");
          const masterModal = document.getElementById("masterLoginModal");
          if (!passkeyModal || !masterModal) {
            alert("Master login is currently unavailable.");
            return;
          }

          masterModal.hidden = true;
          passkeyModal.hidden = false;
          document.body.style.overflow = "hidden";
          window.setTimeout(() => document.getElementById("masterPasskeyInput")?.focus(), 30);
        }

        function verifyMasterPasskey(event) {
          event.preventDefault();
          event.stopPropagation();

          const input = document.getElementById("masterPasskeyInput");
          const value = String(input?.value || "").trim();

          if (value !== MASTER_PASSKEY) {
            if (input) {
              input.value = "";
              input.focus();
            }
            alert("Incorrect master passkey.");
            return;
          }

          const passkeyModal = document.getElementById("masterPasskeyModal");
          const masterModal = document.getElementById("masterLoginModal");
          if (passkeyModal) passkeyModal.hidden = true;
          if (masterModal) masterModal.hidden = false;
          document.body.style.overflow = "hidden";
          if (input) input.value = "";
        }

        window.openMasterLogin = openMasterPasskey;
        window.__openShopMax99MasterPasskey = openMasterPasskey;

        document.addEventListener("DOMContentLoaded", function () {
          const form = document.getElementById("masterPasskeyForm");
          if (form && !form.dataset.bound) {
            form.dataset.bound = "1";
            form.addEventListener("submit", verifyMasterPasskey);
          }
        });
      })();

      function bindMaintenanceStaffAccess() {
        const staffAccess = document.getElementById("maintenanceStaffAccessBtn");
        if (!staffAccess || staffAccess.dataset.bound) return;
        staffAccess.dataset.bound = "1";
        staffAccess.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopPropagation();
          // Maintenance access uses the exact same Master Login /
          // passkey gate as the footer Master Login link.
          const passkeyModal = document.getElementById("masterPasskeyModal");
          if (passkeyModal) {
            passkeyModal.hidden = false;
            passkeyModal.style.zIndex = "4000000";
          }
          if (typeof window.openMasterLogin === "function") {
            window.openMasterLogin();
          } else if (typeof window.__openShopMax99MasterPasskey === "function") {
            window.__openShopMax99MasterPasskey();
          } else {
            alert("Master login is currently unavailable.");
          }
        });
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindMaintenanceStaffAccess, { once: true });
      } else {
        bindMaintenanceStaffAccess();
      }

      /* =========================================================
   INFORMATION PAGES
========================================================= */

      function openShopMax99InfoPage(type) {
        const pages = {
          help: {
            title: "Help Center",
            content: `
                <p>
                    Welcome to the ShopMax99 Help Center.
                </p>

                <p>
                    For assistance with orders, payments, delivery,
                    returns, refunds, or your account, please contact
                    our customer support team.
                </p>
            `,
          },

          contact: {
            title: "Contact Us",
            content: `
                <p>
                    ShopMax99 Customer Support
                </p>

                <p>
                    Email: support@shopmax99.com
                </p>

                <p>
                    Our support team can assist you with orders,
                    payments, delivery, returns, refunds, and
                    account-related queries.
                </p>
            `,
          },

          shipping: {
            title: "Shipping & Delivery",
            content: `
                <p>
                    Shipping and delivery information will be
                    available after placing your order.
                </p>

                <p>
                    Delivery time may vary depending on your location,
                    product availability, and courier service.
                </p>
            `,
          },

          returns: {
            title: "Return & Refund Policy",
            content: `
                <p>
                    Return and refund eligibility may vary depending
                    on the product and order status.
                </p>

                <p>
                    To request a return, open the relevant order from
                    the My Orders section and follow the available
                    return options.
                </p>
            `,
          },

          privacy: {
            title: "Privacy Policy",
            content: `
                <p>
                    ShopMax99 may collect and use customer account,
                    order, and checkout information to provide and
                    improve website services.
                </p>

                <p>
                    Sensitive payment information should not be stored
                    unnecessarily by the website.
                </p>
            `,
          },

          terms: {
            title: "Terms & Conditions",
            content: `
                <p>
                    By using ShopMax99, customers agree to follow
                    the applicable website terms, policies, and
                    conditions.
                </p>

                <p>
                    Product availability, pricing, delivery,
                    returns, and other services may be subject
                    to applicable policies.
                </p>
            `,
          },

          "seller-support": {
            title: "Seller Support",
            content: `
                <p>
                    Seller Support is available for assistance with
                    seller accounts, product listings, approvals,
                    orders, and earnings.
                </p>

                <p>
                    Please use the Seller Panel for account and
                    product-related operations.
                </p>
            `,
          },

          "seller-terms": {
            title: "Seller Terms",
            content: `
                <p>
                    Sellers must provide accurate product information,
                    pricing, availability, and stock details.
                </p>

                <p>
                    Products may be displayed on ShopMax99 only after
                    the required approval process has been completed.
                </p>
            `,
          },
        };

        const page = pages[type];

        if (!page) return;

        let modal = document.getElementById("shopmax99FooterInfoModal");

        if (!modal) {
          modal = document.createElement("div");

          modal.id = "shopmax99FooterInfoModal";

          modal.innerHTML = `
            <div class="shopmax99-info-overlay">

                <div class="shopmax99-info-modal">

                    <button
                        type="button"
                        class="shopmax99-info-close"
                        aria-label="Close">
                        ×
                    </button>

                    <h2 id="shopmax99InfoTitle"></h2>

                    <div id="shopmax99InfoContent"></div>

                </div>

            </div>
        `;

          document.body.appendChild(modal);

          modal.addEventListener("click", function (event) {
            if (
              event.target.classList.contains("shopmax99-info-overlay") ||
              event.target.closest(".shopmax99-info-close")
            ) {
              modal.style.display = "none";
            }
          });
        }

        document.getElementById("shopmax99InfoTitle").textContent = page.title;

        document.getElementById("shopmax99InfoContent").innerHTML =
          page.content;

        modal.style.display = "block";
      }

      /* =========================================================
   SELLER / ADMIN LOGIN
========================================================= */

      function openSellerLogin() {
        if (window.ShopMax99?.maintenance?.isActive?.()) {
          window.ShopMax99.maintenance.apply("customer");
          return;
        }
        const registerModal = document.getElementById("sellerRegisterModal");
        if (registerModal) registerModal.hidden = true;

        const modal = document.getElementById("sellerLoginModal");
        if (!modal) {
          alert("Seller Login is currently unavailable.");
          return;
        }

        modal.hidden = false;
        document.body.style.overflow = "hidden";
      }

      function openAdminLogin() {
        const modal = document.getElementById("adminLoginModal");
        if (!modal) {
          alert("Admin Login is currently unavailable.");
          return;
        }

        // Always start a fresh Admin authentication challenge.
        // An old session must never bypass email/password + OTP.
        localStorage.removeItem("shopmax99_admin_session");
        localStorage.removeItem("shopmax99_admin_login_otp");
        const form = document.getElementById("adminLoginForm");
        if (form) form.reset();
        const otpGroup = document.getElementById("adminLoginOTP")?.closest(".form-group");
        if (otpGroup) otpGroup.hidden = true;
        const demoOtp = form?.querySelector("[data-shopmax99-demo-otp]");
        if (demoOtp) demoOtp.hidden = true;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        setTimeout(() => document.getElementById("adminLoginEmail")?.focus(), 30);
      }

      function closeRoleLoginModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.hidden = true;

        const anyOpen = [...document.querySelectorAll(".modal-overlay")].some(
          (item) => !item.hidden,
        );

        if (!anyOpen) document.body.style.overflow = "";
      }

      /* =========================================================
         SELLER AUTHENTICATION
         Supports both the current seller record format and older
         frontend records so existing prototype accounts continue
         to work.
      ========================================================= */
      function getSellerLoginValue(seller, type) {
        if (!seller || typeof seller !== "object") return "";

        if (type === "email") {
          return String(
            seller.email ??
              seller.sellerEmail ??
              seller.loginEmail ??
              seller.username ??
              seller.login?.email ??
              seller.credentials?.email ??
              "",
          )
            .trim()
            .toLowerCase();
        }

        return String(
          seller.password ??
            seller.sellerPassword ??
            seller.loginPassword ??
            seller.pass ??
            seller.login?.password ??
            seller.credentials?.password ??
            "",
        );
      }

      function getSellerRecordsForLogin() {
        const rawKeys = [
          "shopmax99_sellers",
          "shopmax99Sellers",
          "shopmax99_seller_accounts",
          "shopmax99SellerAccounts",
        ];

        for (const key of rawKeys) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;

            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
              return parsed.filter((item) => item && typeof item === "object");
            }

            if (parsed && typeof parsed === "object") {
              // Support an object keyed by seller ID/email.
              const values = Object.values(parsed);
              if (values.some((item) => item && typeof item === "object")) {
                return values.filter(
                  (item) => item && typeof item === "object",
                );
              }
            }
          } catch (error) {
            console.warn("Seller storage read failed for", key, error);
          }
        }

        return [];
      }

      function sellerLogin(event) {
        event.preventDefault();
        event.stopPropagation();

        const email = String(
          document.getElementById("sellerLoginEmail")?.value || "",
        )
          .trim()
          .toLowerCase();

        const password = String(
          document.getElementById("sellerLoginPassword")?.value || "",
        );

        if (!email || !password) {
          alert("Please enter your seller email and password.");
          return;
        }

        const sellers = getSellerRecordsForLogin();

        const seller = sellers.find((item) => {
          return getSellerLoginValue(item, "email") === email;
        });

        if (!seller) {
          alert(
            "Seller account not found for this email. Please register first or use the email used during Seller Registration.",
          );
          return;
        }

        const savedPassword = getSellerLoginValue(seller, "password");

        if (!savedPassword || savedPassword !== password) {
          alert(
            "Incorrect seller email or password. The email was found, but the password does not match the registered seller account.",
          );
          return;
        }

        const status = String(
          seller.status ||
            seller.accountStatus ||
            seller.approvalStatus ||
            "pending",
        )
          .trim()
          .toLowerCase();

        if (status === "blocked" || status === "rejected") {
          alert(
            "Your seller account is currently " +
              status +
              ". Please contact ShopMax99 support.",
          );
          return;
        }

        if (status !== "approved" && status !== "active") {
          alert("Your seller account is still pending admin approval.");
          return;
        }

        const user = {
          id: seller.id,
          name: seller.fullName || seller.shopName || "Seller",
          email: getSellerLoginValue(seller, "email"),
          phone: seller.phone || "",
          role: "seller",
          sellerId: seller.id,
          shopName: seller.shopName || "",
          createdAt: seller.createdAt || new Date().toISOString(),
        };

        // Keep the current canonical fields available to the existing
        // Seller Workspace, even when the account came from an older version.
        if (!seller.email) seller.email = getSellerLoginValue(seller, "email");
        if (!seller.password)
          seller.password = getSellerLoginValue(seller, "password");

        localStorage.setItem("shopmax99_user", JSON.stringify(user));
        localStorage.setItem("shopmax99CurrentSeller", JSON.stringify(seller));
        localStorage.setItem("currentSeller", JSON.stringify(seller));

        closeRoleLoginModal("sellerLoginModal");

        if (typeof window.ShopMax99?.showRole === "function") {
          window.ShopMax99.showRole("seller");
        } else {
          alert("Seller Center is currently unavailable.");
        }

        const form = document.getElementById("sellerLoginForm");
        if (form) form.reset();
      }

      /* =========================================================
         ADMIN AUTHENTICATION
         Frontend prototype credentials:                 
         Email:    admin@shopmax99.com
         Password: Admin@123
      ========================================================= */
      let pendingAdminOtp = null;

      function generateAdminOtp() {
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        pendingAdminOtp = {
          otp,
          createdAt: Date.now(),
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
        try {
          localStorage.setItem("shopmax99_admin_otp_challenge", JSON.stringify(pendingAdminOtp));
        } catch (_) {}
        return otp;
      }

      function readAdminOtp() {
        if (pendingAdminOtp) return pendingAdminOtp;
        try {
          const value = JSON.parse(localStorage.getItem("shopmax99_admin_otp_challenge") || "null");
          if (value && value.otp) pendingAdminOtp = value;
        } catch (_) {}
        return pendingAdminOtp;
      }

      function openAdminOtpModal(destination) {
        const modal = document.getElementById("adminOtpModal");
        const note = document.getElementById("adminOtpDestination");
        const demo = document.getElementById("adminOtpDemo");
        if (!modal) {
          alert("OTP verification is currently unavailable.");
          return;
        }
        const otp = generateAdminOtp();
        if (note) note.textContent = `Verification code generated for ${destination}. Enter the 6-digit OTP below.`;
        if (demo) {
          demo.hidden = false;
          demo.textContent = `Prototype OTP: ${otp}`;
        }
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        setTimeout(() => document.getElementById("adminOtpInput")?.focus(), 30);
      }

      function completeAdminLogin() {
        let adminCredentials = { email: "admin@shopmax99.com", password: "Admin@123" };
        try {
          const stored = JSON.parse(localStorage.getItem("shopmax99_admin_credentials") || "null");
          if (stored?.email && stored?.password) adminCredentials = stored;
        } catch (_) {}
        const ADMIN_EMAIL = String(adminCredentials.email).trim().toLowerCase();
        localStorage.setItem("shopmax99_admin_session", JSON.stringify({
          email: ADMIN_EMAIL,
          role: "admin",
          loggedInAt: new Date().toISOString(),
          otpVerifiedAt: new Date().toISOString()
        }));
        pendingAdminOtp = null;
        localStorage.removeItem("shopmax99_admin_otp_challenge");
        const otpModal = document.getElementById("adminOtpModal");
        if (otpModal) otpModal.hidden = true;
        const form = document.getElementById("adminOtpForm");
        if (form) form.reset();
        const demo = document.getElementById("adminOtpDemo");
        if (demo) demo.hidden = true;
        closeRoleLoginModal("adminLoginModal");
        document.body.style.overflow = "";
        if (typeof window.ShopMax99?.showRole === "function") {
          window.ShopMax99.showRole("admin");
        } else {
          alert("Admin Control Center is currently unavailable.");
        }
      }

      function verifyAdminOtp(event) {
        event.preventDefault();
        event.stopPropagation();
        const input = String(document.getElementById("adminOtpInput")?.value || "").trim();
        const challenge = readAdminOtp();
        if (!challenge || Date.now() > Number(challenge.expiresAt || 0)) {
          alert("OTP expired. Please request a new OTP.");
          return;
        }
        if (input !== String(challenge.otp)) {
          alert("Incorrect OTP. Please try again.");
          return;
        }
        completeAdminLogin();
      }

      function adminLogin(event) {
        event.preventDefault();
        event.stopPropagation();
        const email = String(document.getElementById("adminLoginEmail")?.value || "").trim().toLowerCase();
        const password = String(document.getElementById("adminLoginPassword")?.value || "");
        let adminCredentials = { email: "admin@shopmax99.com", password: "Admin@123" };
        try {
          const stored = JSON.parse(localStorage.getItem("shopmax99_admin_credentials") || "null");
          if (stored?.email && stored?.password) adminCredentials = stored;
        } catch (_) {}
        const ADMIN_EMAIL = String(adminCredentials.email).trim().toLowerCase();
        const ADMIN_PASSWORD = String(adminCredentials.password);
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
          alert("Incorrect admin email or password.");
          return;
        }
        openAdminOtpModal(ADMIN_EMAIL);
      }

      document.addEventListener("DOMContentLoaded", function () {
        const sellerLoginForm = document.getElementById("sellerLoginForm");
        const adminLoginForm = document.getElementById("adminLoginForm");
        const sellerLoginFromRegister = document.getElementById(
          "sellerLoginFromRegister",
        );
        const sellerRegisterFromLogin = document.getElementById(
          "sellerRegisterFromLogin",
        );

        if (sellerLoginForm)
          sellerLoginForm.addEventListener("submit", sellerLogin);
        if (adminLoginForm)
          adminLoginForm.addEventListener("submit", adminLogin);

        const adminOtpForm = document.getElementById("adminOtpForm");
        const adminOtpResend = document.getElementById("adminOtpResend");
        if (adminOtpForm) adminOtpForm.addEventListener("submit", verifyAdminOtp);
        if (adminOtpResend) {
          adminOtpResend.addEventListener("click", function () {
            let adminCredentials = { email: "admin@shopmax99.com" };
            try {
              const stored = JSON.parse(localStorage.getItem("shopmax99_admin_credentials") || "null");
              if (stored?.email) adminCredentials = stored;
            } catch (_) {}
            openAdminOtpModal(String(adminCredentials.email).trim().toLowerCase());
          });
        }

        if (sellerLoginFromRegister) {
          sellerLoginFromRegister.addEventListener("click", function () {
            const registerModal = document.getElementById(
              "sellerRegisterModal",
            );
            if (registerModal) registerModal.hidden = true;
            openSellerLogin();
          });
        }

        if (sellerRegisterFromLogin) {
          sellerRegisterFromLogin.addEventListener("click", function () {
            const loginModal = document.getElementById("sellerLoginModal");
            if (loginModal) loginModal.hidden = true;
            const registerModal = document.getElementById(
              "sellerRegisterModal",
            );
            if (registerModal) {
              registerModal.hidden = false;
              document.body.style.overflow = "hidden";
            }
          });
        }
      });


const footerYear = document.getElementById("shopmax99FooterYear");
      if (footerYear) footerYear.textContent = new Date().getFullYear();


(function () {
        "use strict";

        function getSellers() {
          try {
            const value = JSON.parse(
              localStorage.getItem("shopmax99_sellers") || "[]",
            );
            return Array.isArray(value) ? value : [];
          } catch {
            return [];
          }
        }

        function saveSellers(sellers) {
          localStorage.setItem("shopmax99_sellers", JSON.stringify(sellers));
        }

        function closeModal(id) {
          const modal = document.getElementById(id);
          if (modal) modal.hidden = true;
          const anyOpen = [...document.querySelectorAll(".modal-overlay")].some(
            (m) => !m.hidden,
          );
          if (!anyOpen) document.body.style.overflow = "";
        }

        function registerSeller(event) {
          event.preventDefault();
          event.stopImmediatePropagation();

          const form = event.currentTarget;
          const data = new FormData(form);

          const seller = {
            id: "SEL-" + Date.now(),
            fullName: String(data.get("fullName") || "").trim(),
            shopName: String(data.get("shopName") || "").trim(),
            email: String(data.get("email") || "")
              .trim()
              .toLowerCase(),
            phone: String(data.get("phone") || "").trim(),
            password: String(data.get("password") || ""),
            address: String(data.get("address") || "").trim(),
            status: "pending",
            kycStatus: "not_submitted",
            bankDetails: null,
            createdAt: new Date().toISOString(),
          };

          if (
            !seller.fullName ||
            !seller.shopName ||
            !seller.email ||
            !seller.phone ||
            !seller.password ||
            !seller.address
          ) {
            alert("Please fill all seller registration fields.");
            return;
          }

          if (seller.password.length < 6) {
            alert("Seller password must be at least 6 characters.");
            return;
          }

          const sellers = getSellers();
          if (
            sellers.some(
              (s) => String(s.email || "").toLowerCase() === seller.email,
            )
          ) {
            alert(
              "A seller account with this email already exists. Please use Seller Login.",
            );
            return;
          }

          sellers.push(seller);
          saveSellers(sellers);
          closeModal("sellerRegisterModal");
          form.reset();

          if (typeof window.ShopMax99?.showToast === "function") {
            window.ShopMax99.showToast(
              "Seller registration submitted for admin approval.",
            );
          } else {
            alert("Seller registration submitted for admin approval.");
          }
        }

        document.addEventListener("DOMContentLoaded", function () {
          const form = document.getElementById("sellerRegisterForm");
          if (form) form.addEventListener("submit", registerSeller, true);
        });
      })();

