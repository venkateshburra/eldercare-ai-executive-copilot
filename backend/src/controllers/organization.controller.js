import Organization from "../models/Organization.js";

export const createOrganization = async (req, res) => {
  try {
    const { name, slug } = req.body;

    const organization = await Organization.create({
      name,
      slug,
    });

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: organization,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};