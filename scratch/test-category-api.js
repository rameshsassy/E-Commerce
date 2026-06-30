import fetch from "node-fetch";
const loginUrl = "http://localhost:5000/api/auth/login";
const categoryUrl = "http://localhost:5000/api/categories";

const run = async () => {
  try {
    // 1. Login
    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-portal": "customer"
      },
      body: JSON.stringify({ email: "admin@aashansh.org", password: "Admin@12345" }),
    });
    const loginData = await loginRes.json();
    console.log("Login response status:", loginRes.status);
    if (!loginRes.ok) {
      console.error("Login failed:", loginData);
      return;
    }
    const token = loginData.token;
    console.log("Token acquired:", token ? "yes" : "no");

    // 2. Create category
    const payload = {
      name: "New Frontend Category Test",
      description: "",
      commissionRate: 5,
      isActive: true,
      isFeatured: false,
      parentCategory: "",
      subCategory: "",
      productType: "",
      customParentCategory: "",
      customSubCategory: "",
      customProductType: ""
    };

    const catRes = await fetch(categoryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "x-portal": "customer"
      },
      body: JSON.stringify(payload),
    });
    const catData = await catRes.json();
    console.log("Create category response status:", catRes.status);
    console.log("Create category response body:", catData);
  } catch (error) {
    console.error("Error in test script:", error);
  }
};

run();
