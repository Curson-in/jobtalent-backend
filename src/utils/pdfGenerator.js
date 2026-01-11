import PDFDocument from "pdfkit";

export const generatePDFBuffer = (text) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .text("AI Resume Enhancement", { align: "center" });

    doc.moveDown(1.5);

    doc.font("Helvetica").fontSize(11);

    text.split("\n").forEach(line => {
  if (/^\d+\.\s/.test(line)) {
    doc.moveDown(1).font("Helvetica-Bold").fontSize(13).text(line);
    doc.moveDown(0.5).font("Helvetica").fontSize(11);
  } else {
    doc.text(line, { lineGap: 4 });
  }
});


    doc.end();
  });
};

