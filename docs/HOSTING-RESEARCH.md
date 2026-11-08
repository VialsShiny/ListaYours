# Free hosting research: FastAPI + Playwright/Chromium API that must never sleep

Check date for every figure: **2026-11-08**. Sources are official docs/pricing pages. Anything not read directly on an official page is marked **[uncertain]**.

Workload: FastAPI + Playwright/headless Chromium, ~1 GB RAM realistic (512 MB floor), ~1.5 GB Docker image, outbound scraping, **no sleep / no cold start after an idle hour**, plus free managed Postgres and a Next.js frontend.

---

## 1. Compute hosts: summary

| Host (free offer) | Sleeps / scale-to-zero | RAM / CPU | Card at signup | Docker | Outbound | Fits? |
|---|---|---|---|---|---|---|
| **Oracle Always Free** (A1 Flex ARM or 2x AMD Micro) | No. VM runs 24/7; risk = idle-reclamation rule (1.1) | A1: 2 OCPU / 12 GB total; Micro: 1/8 OCPU / 1 GB each | **Yes** (not charged unless upgraded) | Yes (full VM) | Yes, 10 TB/mo | **Yes** |
| **Hugging Face Spaces** (CPU Basic, Docker SDK) | Yes, after **48 h**; not configurable on free hw. Docker Spaces now need **PRO ($9/mo)** | 2 vCPU / 16 GB / 50 GB ephemeral | No (PRO needs payment) | Yes | Ports 80/443/8080 only | No |
| **Google Cloud Run** | Scales to zero; `min-instances=1` avoids it but idle time is **billed**; free tier ≈ 7% of a month at 1 vCPU/1 GiB | Configurable | **Yes** (billing account + payment method) | Yes | Yes, 1 GB/mo free egress | No (not free always-on) |
| **Koyeb** Free Instance | Yes, after **1 h**; cannot be disabled | 0.1 vCPU / 512 MB / 2 GB | Mixed **[uncertain]** | Yes | Yes | No |
| **Render** Free web service | Yes, after **15 min**; ~1 min spin-up | 0.1 CPU / 512 MB | Not stated **[uncertain]** | Yes | Yes (SMTP ports blocked) | No |
| **Fly.io** | **No free tier**; $1 credit for 7 days | 1 GB machine = $6.70/mo | **Yes** | Yes | Yes | No |
| Railway Free | Not stated **[uncertain]** | cap 1 vCPU / 0.5 GB; **$1/mo credit** | Not stated **[uncertain]** | Yes (4 GB image cap) | Yes | No |
| Zeabur Free | Yes, auto-sleep | Not stated | No | Yes | Yes | No |
| Northflank Sandbox | **"Always on, no sleeping"**; $20/mo of resources, 2 services, 2 jobs, 1 DB | Not stated **[uncertain]** | **No** | Yes | Yes | **Fallback** |

### 1.1 Oracle Cloud Always Free

| Item | Value | Source |
|---|---|---|
| Ampere A1 Flex | "the first 1,500 OCPU hours and 9,000 GB hours per month for free... For Always Free tenancies, this is equivalent to 2 OCPUs and 12 GB of memory", split flexibly across instances | https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm |
| AMD Micro | "up to two Always Free VM instances using the VM.Standard.E2.1.Micro shape": 1/8 OCPU (burstable), 1 GB each | same |
| Storage / egress | 200 GB block+boot total, 5 backups; "10 TB per month of outbound data" | same |
| **Idle reclamation (verbatim)** | "Idle Always Free compute instances may be reclaimed by Oracle. Oracle will deem... compute instances as idle if, during a 7-day period, the following are true: CPU utilization for the 95th percentile is less than 20%; Network utilization is less than 20%; Memory utilization is less than 20% (applies to A1 shapes only)" | same |
| Card | "most users need a mobile phone number and a credit card to create an account. Your credit card will not be charged unless you upgrade your account." | https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm |
| Card types | Credit cards or credit-like debit; "We do not accept debit cards with a PIN or virtual, single-use, or prepaid cards"; periodic temporary authorization hold | https://www.oracle.com/cloud/free/faq/ (HTTP 403 to my fetcher; text from search index) **[uncertain wording]** |
| Idle account | "Accounts left idle for 30 days or more may be deemed abandoned" | same FAQ **[uncertain]** |
| After trial | "your account remains active. There is no interruption to the availability of the Always Free Resources you have provisioned." A1 above 2 OCPU / 12 GB is disabled, then deleted after 30 days unless upgraded | freetier.htm |
| Home region | Always Free compute/ADB only in the home region chosen at signup | freetier.htm |
| Autonomous DB | "two Always Free Oracle Autonomous AI Databases", 1 OCPU, 20 GB, 20 sessions (Oracle SQL, not Postgres) | Always_Free_Resources page |

ToS risk: the 7-day idle rule needs **all three** conditions to hold; a daily Chromium scrape typically pushes 95th-percentile CPU above 20%, but monitor it. Whether Pay-As-You-Go-upgraded tenancies are exempt is not stated **[uncertain]**. "Out of capacity" errors on A1 in busy regions are community lore, not documented **[uncertain]**. Nothing official forbids scraping.

### 1.2 Hugging Face Spaces

| Item | Value | Source |
|---|---|---|
| Free hardware | CPU Basic: 2 vCPU, 16 GB, 50 GB non-persistent disk, "FREE" | https://huggingface.co/docs/hub/spaces-overview |
| Who can create Docker Spaces | "Gradio and Docker Spaces run on compute and require a paid plan to create: PRO for personal accounts". Free accounts: up to 2 ZeroGPU Gradio Spaces | same |
| PRO | $9/month, "Host your own ZeroGPU, Gradio & Docker Spaces on compute" | https://huggingface.co/pricing |
| Sleep | "it will go to sleep if inactive for more than a set time (currently, 48 hours)... If you want your Space never to deactivate... you need to upgrade to paid hardware" | https://huggingface.co/docs/hub/spaces-gpus |
| Network | Outbound only on ports 80, 443, 8080 | spaces-overview |
| Pinger | Not addressed; content policy bans "unauthorized bot APIs", tunnels/proxies "to bypass restrictions", "excessive or irrelevant data" | https://huggingface.co/content-policy |

### 1.3 Google Cloud Run

| Item | Value | Source |
|---|---|---|
| Free tier (request-based) | "2 million requests per month", "360,000 GB-seconds of memory, 180,000 vCPU-seconds", "1 GB of outbound data transfer from North America per month" | https://docs.cloud.google.com/free/docs/free-cloud-features |
| Free tier (instance-based) | 240,000 vCPU-s, 450,000 GiB-s/mo (search index of https://cloud.google.com/run/pricing; page would not render) **[uncertain]** |
| Card | "A Google Cloud billing account is required to access the Google Cloud Free Tier"; trial requires "a credit card or other payment method"; $300 over 90 days; no auto-charge unless upgraded | free-cloud-features |
| min-instances billing | Request-based: "billed at a lower rate when instances are idle... If min instances is set to 0, you are not billed when instances are idle." Instance-based: "billed the default rate for the entire instance lifecycle" | https://docs.cloud.google.com/run/docs/configuring/min-instances |

**Is `min-instances=1` free? No.** A month is ~2,592,000 s; one 1 vCPU / 1 GiB instance uses 2,592,000 vCPU-s and GiB-s, versus 180,000 vCPU-s (~7%) and 360,000 GiB-s (~14%) free. Idle min-instances are billed (discounted under request-based billing). Only the $300 trial would absorb it.

### 1.4 Koyeb

| Item | Value | Source |
|---|---|---|
| Free Instance | "512MB of RAM, 0.1 vCPU, and 2GB of SSD"; one per org; Frankfurt or Washington DC; no Workers/Volumes; "should not be used for production applications" | https://www.koyeb.com/docs/reference/instances |
| Sleep | "scales down to zero after 1 hour without traffic"; "cannot be disabled"; cold start 1-5 s (generic Deep Sleep figure, not specific to the Free Instance) | https://www.koyeb.com/docs/run-and-scale/scale-to-zero |
| Charges | "You will never be charged when using the free web Service." Free Postgres: 5 h active/month, 1 GB | https://www.koyeb.com/docs/faqs/pricing |
| Card | FAQ: "We require a credit card to prevent fraud and abuse" ($29 pre-auth, cancelled). 2023 blog: card only if automated human check fails **[uncertain which applies]** | FAQ; https://www.koyeb.com/blog/sustaining-free-compute-in-a-hostile-environment |
| Pinger | Not mentioned; blog documents anti-abuse crackdowns | same |
| Cheapest paid | eco-small 0.5 vCPU / 1 GB $5.36/mo; eco-micro $2.68/mo | instances reference |

### 1.5 Render

| Item | Value | Source |
|---|---|---|
| Free web service | 0.1 CPU / 512 MB (plan `free`), web services only | https://render.com/docs/compute-plans |
| Sleep | "Render spins down a Free web service that goes 15 minutes without receiving any inbound traffic" (HTTP or WebSocket counts); spin-up "takes about one minute"; "Paid compute plans do not spin down" | https://render.com/docs/free ; https://render.com/docs/faq |
| Limits | "750 Free instance hours to each workspace per calendar month" (spun-down time free; exhausting suspends all free services); bandwidth/build minutes draw on workspace included amounts (figures not on pages read **[uncertain]**) | docs/free |
| Restrictions | No persistent disk, may restart any time, single instance, SMTP ports blocked, "not for production use"; free Postgres expires after 30 days | docs/free |
| Docker | Dockerfile and prebuilt images supported; Free not excluded on pages read | https://render.com/docs/web-services |
| Pinger | Not forbidden in docs; constraint is the 750 h quota (one 24/7 service ≈ 720-744 h, so exactly one fits). Terms page body unreadable to my fetcher **[uncertain]** | docs/free |

### 1.6 Fly.io

"New organizations don't have a free tier or a monthly free usage allowance"; "$1 of credit... lasts for 7 days" (no card for that); otherwise "All organizations... require a credit card on file". shared-cpu-1x 256 MB $2.19/mo, 1 GB $6.70/mo. Source: https://docs.fly.io/about/pricing.

### 1.7 Railway, Zeabur, Northflank

| Host | Verified | Source |
|---|---|---|
| Railway | Trial: one-time $5, up to 30 days, "No credit card required", caps 2 vCPU / 1 GB. Then Free plan: "$1 of free credit per month", caps 1 vCPU / 0.5 GB, 4 GB image, no rollover. Hobby $5/mo | https://railway.com/pricing ; https://docs.railway.com/reference/pricing/plans ; https://docs.railway.com/reference/pricing/free-trial |
| Zeabur | Free $0, "No credit card required", but services auto-sleep after inactivity; Dev $5/mo | https://zeabur.com/docs/en-US/pricing/free-plan |
| Northflank | Sandbox: "No card needed", "Up to $20/mo of resources on Northflank Cloud", "2 services, 2 jobs, and 1 database", "Always on, no sleeping". nf-compute-50 = 0.5 vCPU / 1 GB is listed at $12.00/month on the pricing page (checked 2026-11-08), so it fits the $20 budget; build minutes and a database draw from the same budget | https://northflank.com/pricing |

---

## 2. Keep-alive pingers

| Service | Free tier | Source |
|---|---|---|
| cron-job.org | "absolutely free"; "frequencies up to once per minute"; no job cap but "fair usage"; 30 s timeout; 64 KB response cap | https://cron-job.org/en/ ; https://cron-job.org/en/faq/ |
| UptimeRobot | "50 monitors", "5 min. monitoring interval", HTTP/keyword monitors, "No credit card required!" | https://uptimerobot.com/pricing/ |

**None of Render, Hugging Face or Koyeb explicitly allow or forbid pinging** on the pages read. Render says any inbound traffic resets the timer and awake time burns the 750 h quota. HF's policy bans bypassing restrictions, so pinging is against its spirit. Koyeb's free instance cannot disable scale-to-zero. All three still restart/sleep on their own schedule, so a pinger does not meet a hard "never time out" requirement.

---

## 3. Managed Postgres

| Item | Neon Free | Supabase Free | Oracle ADB Always Free |
|---|---|---|---|
| Projects | 100 | "Limit of 2 active projects" (unlimited paused) | 2 databases |
| Storage | 1 GB/project, 20 GB total | 500 MB | 20 GB fixed |
| Compute | 100 CU-hours/project/month, up to 2 CU (8 GB) | Nano: "Up to 0.5 GB" RAM, shared CPU, 60 connections, "subject to change" | 1 OCPU, 20 sessions |
| Inactivity | "Always enabled on Free (suspends after 5 min, cannot be turned off)"; wakes on next query | "pauses Free Plan projects that show low activity over a 7-day period"; "a few database requests per day" suffices; restorable "for up to 1 year" | Stops after 7 idle days **[uncertain, not re-verified]** |
| Card | "no credit card required" | Not stated **[uncertain]** | Oracle account card |
| Egress | Not stated **[uncertain]** | 5 GB | within 10 TB |
| Engine | Postgres | Postgres | Oracle SQL (not drop-in) |
| Sources | https://neon.com/pricing | https://supabase.com/pricing ; https://supabase.com/docs/guides/platform/compute-and-disk ; https://supabase.com/docs/guides/platform/free-project-pausing | Always_Free_Resources page |

Neon's 5-minute suspend costs a short first-query delay but never pauses the project (100 CU-hours ≈ 400 h at 0.25 CU, so do not ping it constantly). Supabase stays active with a few daily queries; a pause is a hard stop needing manual resume. Either works behind a never-sleeping API with a daily job; Neon is safer against pausing, Supabase against latency. Or self-host Postgres in Docker on the Oracle VM (200 GB storage).

---

## 4. Frontend: Vercel Hobby

| Item | Value | Source |
|---|---|---|
| Rule | Free; "restricts users to non-commercial, personal use only" | https://vercel.com/docs/plans/hobby |
| Commercial = | "any Deployment that is used for the purpose of financial gain of anyone involved": payments, selling, ads, affiliate-first sites; donations OK | https://vercel.com/docs/limits/fair-use-guidelines |
| Included/mo | Fast Data Transfer 100 GB; Fast Origin Transfer 10 GB; 1M function invocations; 4 CPU-hrs; 360 GB-hrs memory; 1M CDN requests; 5K image transformations | docs/plans/hobby |
| Caps | 200 projects, 100 deployments/day, 300 s functions, 1 h logs; overage pauses the feature for 30 days | same |

If the site ever monetises (ads, paid plans, affiliate-first), Hobby is not allowed; Pro is $20/user/month.

---

## 5. Ranked recommendation

| Rank | Host | Reasoning |
|---|---|---|
| **1 (primary)** | **Oracle Always Free, Ampere A1 Flex VM** (one VM, full 2 OCPU / 12 GB), Docker + Caddy/Nginx; Postgres on Neon/Supabase or self-hosted | Only option that is $0, a real VM that never sleeps or cold-starts, large enough for Chromium (12 GB, 2 ARM cores; Playwright ships arm64 Chromium), with unrestricted Docker and 10 TB egress. |
| **2 (fallback)** | **Northflank Sandbox** (free, "Always on, no sleeping", no card), one ~0.5 vCPU / 1 GB container inside the $20/mo budget; Neon/Supabase for Postgres | Only PaaS documenting no-sleep on a free tier without a card. Risks: free compute size unstated, 1 GB is the Chromium floor, 1.5 GB image + builds must fit $20 **[uncertain]**; verify in dashboard first. |
| Paid safety net | Koyeb eco-small ($5.36/mo) or Fly shared-cpu-1x 1 GB ($6.70/mo) | Cheapest always-on paid containers. |

**Card note for the primary:** Oracle **requires a credit card (or non-PIN, non-prepaid debit card) at signup for identity verification**, with a temporary authorization hold; it is not charged unless you upgrade. If that is unacceptable, Northflank Sandbox becomes primary.

Oracle operating caveats: (1) keep the VM above the idle thresholds (95th-pct CPU, network or memory >= 20% over any 7 days) via the daily scrape plus a light monitoring job, and watch OCI metrics; (2) log in at least monthly (30-day idle account rule); (3) pick the home region deliberately, A1 capacity may be scarce **[uncertain]**; (4) open 80/443 in both the VCN security list and the instance firewall.

Rejected for "never sleep": Render (15 min), Koyeb Free (1 h, 0.1 vCPU), Hugging Face (48 h; Docker Spaces PRO-only), Zeabur (auto-sleep), Cloud Run (min-instances billed), Fly.io and Railway Free (no usable free always-on allowance).
