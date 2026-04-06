/**
 * One-off / maintenance: delete every order and reset the display order-id counter.
 * Next placed order will use generateNextOrderId() → e.g. ORD1218AA01 (prefix from ORDER_ID_PREFIX or default ORD1218).
 * Does not change app logic; does not delete products, users, customers, wallet config, or wallet transactions.
 */
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Order from '../models/orderModel.js'
import Counter from '../models/counterModel.js'

dotenv.config()

async function clearAllOrders() {
  try {
    await connectDB()

    const before = await Order.countDocuments()
    console.log(`Found ${before} order(s). Deleting...`)

    const del = await Order.deleteMany({})
    console.log(`Deleted ${del.deletedCount} order document(s).`)

    await Counter.findOneAndUpdate(
      { _id: 'orderDisplayId' },
      { $set: { seq: 0 } },
      { upsert: true, new: true }
    )
    console.log(
      'Reset counter "orderDisplayId" seq → 0. Next order id will be PREFIX + AA01 (e.g. ORD1218AA01).'
    )

    const remaining = await Order.countDocuments()
    if (remaining !== 0) {
      console.warn('Warning: order count is not zero:', remaining)
    }
  } catch (err) {
    console.error('clearAllOrders failed:', err)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
    console.log('Database connection closed.')
  }
}

clearAllOrders()
