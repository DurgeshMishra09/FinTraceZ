FinTrace Z — Team Code Rhythm

IBM Z Datathon 2026 | AI Secured: Innovation Without Exposure

FinTrace Z is a web-based prototype designed to help investigators trace suspicious money transfers across connected bank accounts. It makes it easier to understand where the money started, how it moved between accounts, and where it finally ended up.

Technology used: Vite, React, TypeScript, Tailwind CSS 4, Framer Motion and Lenis.

How to Run

Install the required packages and start the website:

npm install
npm run dev -- --host

Open the local URL shown in the terminal, usually "http://localhost:5173".

To build and preview the project:

npm run build
npm run preview -- --host

For Termux or Android, if installation or startup fails because of a package issue, check the error message in the terminal.

Features Currently Available

- CSV upload: Read transaction data directly in the browser. The file is not uploaded to a server. The CSV should contain sender, receiver and amount columns. A timestamp column is needed for checking transfer speed.
- Fraud pattern checks: Five rule-based checks look for fast pass-through transfers, fan-in, fan-out, chain hopping and possible cash-out points.
- Money trail: Follow the money from the suspected scam source through connected accounts. Each transfer shows its amount, and accounts are arranged in time order.
- Account details: Select an account to view how the money reached it, how it was transferred further and where the trail ended. For trails involving more than 14 accounts, the view switches to a step-by-step investigation.
- Visual investigation: The trail uses a top-down tree layout, with red arrows highlighting the end of the money trail.

Future Scope

Federated learning, differential privacy, secure aggregation and deployment on IBM LinuxONE are planned for future development. These features are not yet implemented in the current prototype.

The tool is intended to help investigators identify cases that may need further review. Its alerts are not proof of fraud, and the sample transaction data is fictional.