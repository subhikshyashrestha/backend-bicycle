const register = async (req, res) => {
  try {
    const { username, email, password, phone, role, citizenshipNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Citizenship image is required" });
    }

    // 👇 CORRECTED LINE
    const citizenshipImage = '/' + req.file.path.replace(/\\/g, '/');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      role,
      citizenshipNumber,
      citizenshipImage,   // 👈 Use the corrected value here
      isVerified: false,
    });

    await newUser.save();

    res.status(201).json({ message: `User registered with username ${username}, pending verification.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong" });
  }
};