# Sentinel Shop Shield

Demo Store (Customer View):

A sleek tech store selling gadget products (e.g., Wireless Earbuds $15 USD, Smartwatch $120 USD).

A floating bottom-right AI Assistant Chatbot Widget (labeled 'Sentinel AI Shopper Guard') that lets customers chat and get product recommendations.

Next to each product checkout, show a real-time badge: if price < $26.67 USD show 'Micro-Fee Route Active (Save 4%)', else show 'Standard PayPal Route'.

Integration container for PayPal Smart Payment Buttons / Fastlane checkout.

Merchant Dashboard (Seller View):

Header metrics: Total Fees Saved ($), Transactions Protected, and API Resilience Rate (99.9%).

Auth Guard Risk Traffic Light: Real-time risk indicator (Low Risk / Green, Medium / Yellow, High / Red).

Anti-180 Days Protection Status: Live log showing PDF invoices & tracking numbers automatically injected via Disputes API.

Interactive Simulation Controls: A prominent button labeled 'Simulate 500 API Error (Braintree/PayPal Fallback)' that shows a live simulation toast/alert of the Async Retry Engine keeping the transaction alive via Webhooks.

Make it look like a top-tier fintech product like Stripe/PayPal dashboard with clean charts and modern animations.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sentinel-shop-shield.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5fb9c8f4-5191-4208-b9b4-fa9e130200ec).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
# Sentinel Shop Shield 🛡️💳

An AI-powered risk evaluation, shopping assistant, and payment fee optimization layer built for the PayPal AI Hackathon.

## 🚀 Key Features
- **PayPal Sandbox Integration:** Dynamic routing between Micro-Fee and Standard PayPal routes based on payment thresholds ($26.67 USD logic).
- **Sentinel AI Shopper Guard:** Real-time conversational AI shopping assistant powered by Google Gemini API (`gemini-1.5-flash`).
- **Auth Guard Dashboard:** Pre-transaction risk scoring, fraud detection, and anti-180-day dispute evidence logs.
- **System Resilience Testing:** 500 API error simulation toggle to guarantee continuous checkout availability.

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS (built with Lovable)
- **Payments:** PayPal Sandbox SDK
- **AI Core:** Google Gemini API (`gemini-1.5-flash`)

## 📦 How to Run Locally
1. Clone the repository:
   ```bash
   git clone [https://github.com/carloscortes3203-pixel/sentinel-shop-shield.git](https://github.com/carloscortes3203-pixel/sentinel-shop-shield.git)

   npm install
   npm run dev
