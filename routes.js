"use strict";

/** Routes for Lunchly */

const express = require("express");

const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  let search = req.query.search;
  let customers;
  if(!search){
    customers = await Customer.all();
  }else{
    customers = await Customer.search(search);
  }

  return res.render("customer_list.html", { customers });
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Shows the top 10 customers with the most reservations */
router.get("/best/", async function (req, res, next) {
  const customers = await Customer.getBestCustomers();

  return res.render("customer_list.html", { customers });
})

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});

/** Show form to edit a reservation. */

router.get("/:cusId/:resId/edit", async function (req, res, next) {
  const customer = await Customer.get(req.params.cusId);
  const reservation = await Reservation.get(req.params.resId);
  console.log("CUTOMER", customer);
  console.log("RES", reservation);
  res.render("reservation_edit_form.html", { customer, reservation });
});

/** Handle editing a reservation. */

router.post("/:cusId/:resId/edit", async function (req, res, next) {
  const customer = await Customer.get(req.params.cusId);
  const reservation = await Reservation.get(req.params.resId);

  reservation.startAt = req.body.startAt;
  reservation.numGuests = req.body.numGuests;
  reservation.notes = req.body.notes;
  await reservation.save();

  return res.redirect(`/${customer.id}/`);
})

module.exports = router;
