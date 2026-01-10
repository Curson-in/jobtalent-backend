import PDFDocument from "pdfkit";

export const generatePDFBuffer = (text) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(12).text(text, {
      align: "left",
      lineGap: 6,
    });

    doc.end();
  });
};
