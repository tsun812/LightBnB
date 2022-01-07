const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  host: 'localhost',
  database: 'lightbnb'
});




/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool.query(`SELECT * FROM users WHERE email = $1`, [email])
  .then(res => res.rows[0])
  .catch(err => null);
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool.query(`SELECT * FROM users WHERE id = $1`, [id])
  .then(res => res.rows[0])
  .catch(err => console.log(err));
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
return pool.query( `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING *`, [user.name, user.email, user.password])
  .then(res => res.rows[0])
  .catch(err => console.log(err));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool.query( `SELECT properties.* FROM reservations JOIN properties ON property_id = properties.id WHERE guest_id = $1   LIMIT $2`, [guest_id, limit])
  .then(res => res.rows)
  .catch(err => console.log(err));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

  const getAllProperties = function (options, limit = 10) {
   
    const queryParams = [];
    let paramIndex = 1;
    let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;
  //filter by minimum rating
  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString +=  `WHERE rating >= $${paramIndex++}`
  }

   //filter by city
    if (options.city) {
      queryParams.push(`%${options.city}%`);
      if (queryParams.length >1) {
        queryString += 'AND ';
      }
      else {queryString += 'WHERE '}
      queryString += `city LIKE $${paramIndex++} `;
    }
  
   
    // filter by price range
    if (options.minimum_price_per_night && options.maximum_price_per_night) {
      if (queryParams.length >1) {
        queryString += 'AND ';
      }
      else {queryString += 'WHERE '}
      queryParams.push(parseInt(options.minimum_price_per_night), parseInt(options.maximum_price_per_night));
      queryString +=  `$${paramIndex++}   <= cost_per_night/100  AND cost_per_night<= $${paramIndex++}`
    }
   
    // set display limits
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${paramIndex++};
    `;
  
    // 5
    console.log(queryString, queryParams);
  
    // 6
    return pool.query(queryString, queryParams).then((res) => res.rows);
  };
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;

