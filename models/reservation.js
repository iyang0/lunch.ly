"use strict";

/** Reservation for Lunchly */

const moment = require("moment");
const { BadRequestError } = require("../expressError");
const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }
  
  /** Set numGuests. Throws error if number of guest is < 1 */
  set numGuests(num){
      if(num<1){
          throw new BadRequestError("There must be at least one guest.")
      }
      this._numGuests = num;
  }
  
  /** Get numGuests. */
  get numGuests(){
      return this._numGuests;
  }

  /** Set startAt. If not a Date, throws error. */
  set startAt(date) {
    let newDate = new Date(date);
    if(newDate.toString() === "Invalid Date") {
      throw new BadRequestError("Must be a date.")
    } 
    this._startAt = new Date(date);
  }

  /** Get startAt. */
  get startAt() {
    return this._startAt;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
        [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }
  
  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.customerId, this.numGuests, this.startAt, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE reservations
             SET customer_id=$1,
                 num_guests=$2,
                 start_at=$3,
                 notes=$4
             WHERE id = $5`, [
            this.customerId,
            this.numGuests,
            this.startAt,
            this.notes,
            this.id,
          ],
      );
    }
  }
  
  /** get a reservation by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
              customer_id AS "customerId",
              num_guests AS "numGuests",
              start_at AS "startAt",
              notes AS "notes"
           FROM reservations
           WHERE id = $1`,
        [id],
    );

    const reservation = results.rows[0];

    if (reservation === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }
}


module.exports = Reservation;
