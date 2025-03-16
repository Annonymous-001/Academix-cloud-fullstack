// "use client";

// import { useReactToPrint } from "react-to-print";
// import { Ref, forwardRef, useRef } from "react";
// import { Payment, Fee, Student } from "@prisma/client";
// import { Printer } from "lucide-react";

// const PrintableReceipt = forwardRef(
//   ({ payment }: { payment: Payment & { fee: Fee & { student: Student } } }, ref: Ref<HTMLDivElement>) => (
//     <div ref={ref} className="p-8 space-y-4 print:p-0 print:space-y-2">
//       <h1 className="text-2xl font-bold print:text-xl">Payment Receipt</h1>
//       <div className="grid grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
//         <div>
//           <p className="text-sm text-gray-500">Receipt No:</p>
//           <p>PAY-{payment.id.toString().padStart(4, "0")}</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Date:</p>
//           <p>{new Date(payment.date).toLocaleDateString()}</p>
//         </div>
//         <div className="col-span-2">
//           <p className="text-sm text-gray-500">Student:</p>
//           <p>{payment.fee.student.name} {payment.fee.student.surname}</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Amount Paid:</p>
//           <p>${payment.amount.toFixed(2)}</p>
//         </div>
//         <div>
//           <p className="text-sm text-gray-500">Payment Method:</p>
//           <p className="capitalize">{payment.method.toLowerCase().replace("_", " ")}</p>
//         </div>
//         {payment.reference && (
//           <div className="col-span-2">
//             <p className="text-sm text-gray-500">Reference:</p>
//             <p>{payment.reference}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// );

// const PrintReceipt = ({ payment }: { payment: Payment & { fee: Fee } }) => {
//   const receiptRef = useRef(null);
//   const handlePrint = useReactToPrint({
//     content: () => receiptRef.current,
//     documentTitle: `Payment_Receipt_${payment.id}`,
//   });

//   return (
//     <>
//       <button
//         onClick={handlePrint}
//         className="p-2 hover:bg-gray-100 rounded-md"
//       >
//         <Printer className="w-4 h-4" />
//       </button>
//       <div className="hidden">
//         <PrintableReceipt ref={receiptRef} payment={payment} />
//       </div>
//     </>
//   );
// };

// export default PrintReceipt;