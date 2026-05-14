import mongoose from "mongoose"

const deploymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true
    },

    websiteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Website",
      required: true
    },

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    contentSnapshot: {
      type: Object,
      required: true
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model("Deployment", deploymentSchema)