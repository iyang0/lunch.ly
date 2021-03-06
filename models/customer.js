"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");
const moment = require("moment");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes, latestReservation }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.latestReservation = latestReservation
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT customers.id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  customers.notes, 
                  MAX(start_at) AS "latestReservation"
    FROM customers LEFT JOIN reservations ON customer_id = customers.id
    GROUP BY customers.id, 
      first_name, 
      last_name, 
      phone, 
      customers.notes
    ORDER BY last_name, first_name;`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** Set latestReservation. If none, sets it to null. */
  set latestReservation(date){
    if(!date){
        this._latestReservation = null;
    } else {
      // this._latestReservation = moment(date).format("MMMM Do YYYY, h:mm a");
      this._latestReservation = moment(date).fromNow();
    }
}

/** Get latestReservation. */
get latestReservation(){
    return this._latestReservation;
}

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT customers.id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  customers.notes,
                  MAX(start_at) AS "latestReservation"
           FROM customers LEFT JOIN reservations ON customer_id = customers.id
           WHERE customers.id = $1
           GROUP BY customers.id, 
            first_name, 
            last_name, 
            phone, 
            customers.notes
           `,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** get top 10 customers with most reservations. */

  static async getBestCustomers() {
    const results = await db.query(
      `
      SELECT customers.id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              customers.notes,
              MAX(start_at) AS "latestReservation"
      FROM customers JOIN reservations ON customer_id = customers.id
      GROUP BY customers.id, first_name, last_name, phone, customers.notes
      ORDER BY COUNT(*) DESC
      LIMIT 10
      `
    );
    
    return results.rows.map(c => new Customer(c));
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }
  
  /* 
  Instance method to return a string containing their full name
  */
  get fullName(){
    return `${this.firstName} ${this.lastName}`;
  }
  
  /* takes in a term to search for customers' names by
    returns an array of customers with the term in their name.
  */
  static async search(searchTerm){
    const results = await db.query(
          `SELECT customers.id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  customers.notes,
                  MAX(start_at) AS "latestReservation"
           FROM customers LEFT JOIN reservations ON customer_id = customers.id
           WHERE lower(first_name) LIKE lower($1) 
              OR lower(last_name) LIKE lower($1)
           GROUP BY customers.id, first_name, last_name, phone, customers.notes
           ORDER BY last_name, first_name`,
        [`%${searchTerm}%`]
    );
    return results.rows.map(c => new Customer(c));
  }
  
}

module.exports = Customer;
