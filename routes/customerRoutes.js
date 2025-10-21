const express = require("express");
const router = express.Router();
const Customer = require("../model/customer");

// Utility to generate random IDs
function randomString(length, chars) {
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
function randomLetters(length = 4) {
  return randomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
}
function randomNumbers(length = 6) {
  return randomString(length, '0123456789');
}

//
// 🧩 CUSTOMER CRUD
//

// ➕ Create customer
router.post("/", async (req, res) => {
  try {
    const { customerNumber, customerName } = req.body;
    const newCustomer = new Customer({ customerNumber, customerName });
    await newCustomer.save();
    res.status(201).json({ message: "Customer created", data: newCustomer });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📜 Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔍 Get one customer by number
router.get("/:customerNumber", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update customer info
router.put("/:customerNumber", async (req, res) => {
  try {
    const updated = await Customer.findOneAndUpdate(
      { customerNumber: req.params.customerNumber },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer updated", data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ❌ Delete customer
router.delete("/:customerNumber", async (req, res) => {
  try {
    const deleted = await Customer.findOneAndDelete({ customerNumber: req.params.customerNumber });
    if (!deleted) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 🧩 STREAM CRUD (inside customer)
//

// ➕ Add a stream to a customer
router.post("/:customerNumber/streams", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const newStream = {
      streamName: randomLetters(),
      streamId: randomNumbers(),
      streamMachine: req.body.streamMachine || "Unknown",
      streamUrl: req.body.streamUrl || "",
      status: false,
    };

    customer.streams.push(newStream);
    await customer.save();
    res.status(201).json({ message: "Stream added", data: customer });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📜 Get all streams of a customer
router.get("/:customerNumber/streams", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Stream List", data: customer.streams } );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✏️ Update a specific stream
router.put("/:customerNumber/streams/:streamId", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const stream = customer.streams.find(s => s.streamId === req.params.streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });

    Object.assign(stream, req.body);
    customer.markModified("streams");
    await customer.save();

    res.json({ message: "Stream updated", data: stream });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// ✏️ Update stream status (true or false)
router.put("/:customerNumber/streams/:streamId/status", async (req, res) => {
  try {
    const { customerNumber, streamId } = req.params;
    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({ message: "Status must be true or false" });
    }

    const customer = await Customer.findOne({ customerNumber });
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const stream = customer.streams.find(s => s.streamId === streamId);
    if (!stream) {
      return res.status(404).json({ message: "Stream not found" });
    }

    stream.status = status;
    customer.markModified("streams");
    await customer.save();

    res.json({
      message: "Stream status updated",
      data: {
        streamName: stream.streamName,
        streamId: stream.streamId,
        status: stream.status,
      },
    });
  } catch (err) {
    console.error("Error updating stream status:", err);
    res.status(500).json({ error: err.message });
  }
});




// ❌ Delete a specific stream
router.delete("/:customerNumber/streams/:streamId", async (req, res) => {
  try {
    const customer = await Customer.findOne({ customerNumber: req.params.customerNumber });
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    customer.streams = customer.streams.filter(s => s.streamId !== req.params.streamId);
    await customer.save();

    res.json({ message: "Stream deleted", data: customer.streams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
