import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Academix Cloud",
  description: "Next.js School Management System",
  icons:{
    icon:"./favicon.ico"
  }
};
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children} <ToastContainer 
            position="bottom-center"
            theme="dark"
            limit={1}
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            style={{
              width: 'auto',
              maxWidth: '90%',
              fontSize: '14px',
              padding: '8px 16px',
              margin: '0 auto',
              borderRadius: '8px',
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
