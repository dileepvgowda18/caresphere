const medicalReference = [
  {
    name: 'Hemoglobin',
    normalRange: 'Male: 13.8–17.2 g/dL; Female: 12.1–15.1 g/dL',
    lowMeaning: 'May suggest anemia, iron deficiency, bleeding, or chronic disease.',
    highMeaning: 'May suggest dehydration, smoking, lung disease, or a bone marrow disorder.',
    simpleExplanation: 'Measures the oxygen-carrying protein in red blood cells.',
    recommendation: 'Discuss low or high results with a clinician, especially if tiredness, breathlessness, or dizziness is present.'
  },
  {
    name: 'WBC',
    normalRange: '4.0–11.0 × 10^9/L',
    lowMeaning: 'May suggest infection risk, bone marrow issues, or medication effects.',
    highMeaning: 'May indicate infection, inflammation, stress, or a blood disorder.',
    simpleExplanation: 'Shows the number of white blood cells that help fight infection.',
    recommendation: 'Repeat testing may be needed if the count is very high or very low.'
  },
  {
    name: 'RBC',
    normalRange: 'Male: 4.3–5.7 × 10^12/L; Female: 3.8–5.1 × 10^12/L',
    lowMeaning: 'May indicate anemia or blood loss.',
    highMeaning: 'May suggest dehydration or a condition that increases red blood cell production.',
    simpleExplanation: 'Measures the number of red blood cells carrying oxygen.',
    recommendation: 'A clinician can help determine whether the result is due to anemia, dehydration, or another cause.'
  },
  {
    name: 'Platelets',
    normalRange: '150–450 × 10^9/L',
    lowMeaning: 'May increase bleeding risk or suggest bone marrow problems.',
    highMeaning: 'May increase clotting risk or be linked to inflammation or iron deficiency.',
    simpleExplanation: 'Measures cells that help blood clot.',
    recommendation: 'Seek medical advice if there is easy bruising, bleeding, or unusual fatigue.'
  },
  {
    name: 'Glucose',
    normalRange: '70–99 mg/dL (fasting)',
    lowMeaning: 'May indicate hypoglycemia, which can cause sweating, shaking, or confusion.',
    highMeaning: 'May suggest diabetes or stress-related high sugar levels.',
    simpleExplanation: 'Measures blood sugar at the time of the test.',
    recommendation: 'Repeat fasting glucose or HbA1c testing may be recommended if the result is abnormal.'
  },
  {
    name: 'HbA1c',
    normalRange: '< 5.7%',
    lowMeaning: 'Usually not a concern, but very low values can sometimes reflect hypoglycemia or treatment effects.',
    highMeaning: 'May indicate diabetes or poor long-term blood sugar control.',
    simpleExplanation: 'Shows average blood sugar over the past 2–3 months.',
    recommendation: 'Discuss elevated results with a clinician for diabetes screening or management.'
  },
  {
    name: 'Creatinine',
    normalRange: '0.6–1.2 mg/dL',
    lowMeaning: 'Usually not clinically significant, though low values can occur with low muscle mass.',
    highMeaning: 'May suggest reduced kidney function or dehydration.',
    simpleExplanation: 'Measures a waste product filtered by the kidneys.',
    recommendation: 'High results may require review of kidney function and hydration status.'
  },
  {
    name: 'Urea',
    normalRange: '7–20 mg/dL',
    lowMeaning: 'May be seen with low protein intake or liver disease.',
    highMeaning: 'May suggest dehydration, kidney disease, or high protein intake.',
    simpleExplanation: 'Shows how well the body is processing and removing nitrogen waste.',
    recommendation: 'High urea may need further kidney and hydration assessment.'
  },
  {
    name: 'Sodium',
    normalRange: '135–145 mmol/L',
    lowMeaning: 'May suggest low sodium from fluid overload, hormone issues, or excess water intake.',
    highMeaning: 'May suggest dehydration, high salt intake, or hormone imbalance.',
    simpleExplanation: 'Checks the body’s fluid and nerve balance.',
    recommendation: 'Seek advice if symptoms such as confusion, weakness, or nausea occur.'
  },
  {
    name: 'Potassium',
    normalRange: '3.5–5.1 mmol/L',
    lowMeaning: 'May cause weakness, cramps, or heart rhythm problems.',
    highMeaning: 'Can be dangerous and may affect the heart rhythm.',
    simpleExplanation: 'Measures an electrolyte important for nerves and muscles.',
    recommendation: 'Very low or very high values should be reviewed urgently.'
  },
  {
    name: 'Calcium',
    normalRange: '8.5–10.5 mg/dL',
    lowMeaning: 'May suggest vitamin D deficiency, low parathyroid hormone, or kidney disease.',
    highMeaning: 'May point to overactive parathyroid glands, cancer, or vitamin D excess.',
    simpleExplanation: 'Measures calcium needed for bones, muscles, and nerves.',
    recommendation: 'Abnormal calcium should be evaluated with related hormone tests if needed.'
  },
  {
    name: 'Magnesium',
    normalRange: '1.7–2.2 mg/dL',
    lowMeaning: 'May cause muscle cramps, weakness, or arrhythmias.',
    highMeaning: 'May cause nausea, weakness, or slow reflexes.',
    simpleExplanation: 'Checks a mineral involved in muscle and nerve function.',
    recommendation: 'Low or high magnesium may need treatment or review of medications.'
  },
  {
    name: 'Phosphate',
    normalRange: '2.5–4.5 mg/dL',
    lowMeaning: 'May suggest vitamin D deficiency, malnutrition, or alcohol use.',
    highMeaning: 'May be linked to kidney disease or parathyroid issues.',
    simpleExplanation: 'Measures phosphate used in bones and energy production.',
    recommendation: 'Further assessment may be needed if symptoms or kidney disease are present.'
  },
  {
    name: 'Vitamin D',
    normalRange: '30–100 ng/mL',
    lowMeaning: 'May suggest deficiency that can affect bone health and immunity.',
    highMeaning: 'Can sometimes be due to excessive supplement use.',
    simpleExplanation: 'Measures vitamin D, which helps absorb calcium and maintain bone strength.',
    recommendation: 'Low vitamin D may be treated with diet, sunlight, and clinician guidance.'
  },
  {
    name: 'Vitamin B12',
    normalRange: '200–900 pg/mL',
    lowMeaning: 'May cause fatigue, numbness, tingling, or anemia.',
    highMeaning: 'Often not clinically significant, though very high levels can occur with supplements.',
    simpleExplanation: 'Measures vitamin B12 needed for red blood cells and nerve function.',
    recommendation: 'Low values may warrant further testing for anemia or absorption problems.'
  },
  {
    name: 'Folate',
    normalRange: '3.0–20.0 ng/mL',
    lowMeaning: 'May contribute to anemia and fatigue.',
    highMeaning: 'May be caused by supplements or certain medications.',
    simpleExplanation: 'Measures folate, a B vitamin important for cell growth and DNA formation.',
    recommendation: 'Discuss low results if you have anemia or poor nutrition.'
  },
  {
    name: 'TSH',
    normalRange: '0.4–4.0 mIU/L',
    lowMeaning: 'May suggest overactive thyroid.',
    highMeaning: 'May suggest underactive thyroid.',
    simpleExplanation: 'Measures thyroid-stimulating hormone that regulates thyroid function.',
    recommendation: 'Further thyroid tests such as free T4 may be needed if abnormal.'
  },
  {
    name: 'T3',
    normalRange: '80–220 ng/dL',
    lowMeaning: 'May occur with hypothyroidism or illness.',
    highMeaning: 'May occur with hyperthyroidism.',
    simpleExplanation: 'Measures the active thyroid hormone T3.',
    recommendation: 'Interpretation should be paired with TSH and T4 results.'
  },
  {
    name: 'T4',
    normalRange: '4.5–12.0 µg/dL',
    lowMeaning: 'May suggest hypothyroidism.',
    highMeaning: 'May suggest hyperthyroidism or thyroid hormone excess.',
    simpleExplanation: 'Measures the main hormone made by the thyroid gland.',
    recommendation: 'A clinician can help interpret this with thyroid symptoms and TSH.'
  },
  {
    name: 'Free T4',
    normalRange: '0.8–1.8 ng/dL',
    lowMeaning: 'May suggest hypothyroidism.',
    highMeaning: 'May suggest hyperthyroidism.',
    simpleExplanation: 'Checks the active form of thyroid hormone available to the body.',
    recommendation: 'Abnormal results are often followed by TSH testing.'
  },
  {
    name: 'LDL',
    normalRange: '< 100 mg/dL',
    lowMeaning: 'Usually not a concern, though extremely low levels may be seen in some rare conditions.',
    highMeaning: 'May increase heart disease risk.',
    simpleExplanation: 'Measures the “bad” cholesterol linked to artery blockage.',
    recommendation: 'High LDL often improves with diet, activity, and medication when needed.'
  },
  {
    name: 'HDL',
    normalRange: '40–60 mg/dL',
    lowMeaning: 'May raise heart disease risk.',
    highMeaning: 'Usually protective, though very high levels can be associated with rare conditions.',
    simpleExplanation: 'Measures the “good” cholesterol that helps remove excess cholesterol.',
    recommendation: 'Low HDL is often addressed with lifestyle changes and risk assessment.'
  },
  {
    name: 'Triglycerides',
    normalRange: '< 150 mg/dL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May increase heart disease risk, especially with high sugar or alcohol intake.',
    simpleExplanation: 'Measures fats in the blood that can be elevated after eating or in metabolic disease.',
    recommendation: 'High triglycerides may improve with diet, exercise, and weight management.'
  },
  {
    name: 'Total Cholesterol',
    normalRange: '< 200 mg/dL',
    lowMeaning: 'Usually not a concern, though very low levels can rarely be seen.',
    highMeaning: 'May suggest increased cardiovascular risk.',
    simpleExplanation: 'Measures all cholesterol in the blood.',
    recommendation: 'Discuss this alongside LDL, HDL, and triglycerides.'
  },
  {
    name: 'ALT',
    normalRange: '7–56 U/L',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest liver inflammation or injury.',
    simpleExplanation: 'Measures an enzyme released by the liver.',
    recommendation: 'Repeated or persistent elevation may need liver evaluation.'
  },
  {
    name: 'AST',
    normalRange: '10–40 U/L',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest liver injury, muscle injury, or alcohol-related damage.',
    simpleExplanation: 'Measures an enzyme found in the liver and other tissues.',
    recommendation: 'High AST is often interpreted alongside ALT and other liver tests.'
  },
  {
    name: 'Bilirubin',
    normalRange: '0.3–1.0 mg/dL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May indicate liver disease, bile blockage, or hemolysis.',
    simpleExplanation: 'Measures a pigment made when red blood cells break down.',
    recommendation: 'Elevated bilirubin may need evaluation for jaundice or liver problems.'
  },
  {
    name: 'Albumin',
    normalRange: '3.5–5.0 g/dL',
    lowMeaning: 'May suggest malnutrition, liver disease, inflammation, or kidney loss.',
    highMeaning: 'Less common; may occur with dehydration.',
    simpleExplanation: 'Measures a protein made by the liver that helps hold fluid in the blood.',
    recommendation: 'Low albumin often prompts review of nutrition, liver, and kidney health.'
  },
  {
    name: 'Total Protein',
    normalRange: '6.0–8.3 g/dL',
    lowMeaning: 'May suggest malnutrition, liver disease, or protein loss.',
    highMeaning: 'May be seen with dehydration or certain chronic diseases.',
    simpleExplanation: 'Measures the total amount of protein in the blood.',
    recommendation: 'Discuss abnormal levels with a clinician if you have symptoms or ongoing illness.'
  },
  {
    name: 'CRP',
    normalRange: '< 3.0 mg/L',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May indicate inflammation, infection, or tissue injury.',
    simpleExplanation: 'Measures a protein made by the liver during inflammation.',
    recommendation: 'High CRP often needs follow-up to find the cause of inflammation.'
  },
  {
    name: 'ESR',
    normalRange: '0–20 mm/hr',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest inflammation, infection, autoimmune disease, or cancer.',
    simpleExplanation: 'Shows how quickly red blood cells settle, which rises with inflammation.',
    recommendation: 'A high ESR usually requires clinical correlation with symptoms and other tests.'
  },
  {
    name: 'Ferritin',
    normalRange: 'Male: 20–250 ng/mL; Female: 10–120 ng/mL',
    lowMeaning: 'May suggest iron deficiency or low iron stores.',
    highMeaning: 'Can be increased with inflammation, liver disease, or excess iron.',
    simpleExplanation: 'Measures the body’s stored iron.',
    recommendation: 'Low ferritin often points to iron deficiency and may require iron evaluation.'
  },
  {
    name: 'Iron',
    normalRange: '60–170 µg/dL',
    lowMeaning: 'May suggest iron deficiency or poor intake.',
    highMeaning: 'May occur with iron overload or inflammation.',
    simpleExplanation: 'Measures the amount of iron circulating in the blood.',
    recommendation: 'Discuss abnormal iron levels with a clinician, especially with fatigue or anemia.'
  },
  {
    name: 'Transferrin Saturation',
    normalRange: '20–50%',
    lowMeaning: 'May indicate iron deficiency.',
    highMeaning: 'May suggest iron overload or excess supplementation.',
    simpleExplanation: 'Shows how much iron is carried in the blood by transferrin.',
    recommendation: 'Low values often prompt iron studies and dietary review.'
  },
  {
    name: 'Uric Acid',
    normalRange: '3.5–7.2 mg/dL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May indicate gout, kidney disease, or high cell turnover.',
    simpleExplanation: 'Measures uric acid, a waste product made during normal cell breakdown.',
    recommendation: 'High values may need evaluation for gout or kidney health.'
  },
  {
    name: 'Amylase',
    normalRange: '30–110 U/L',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'Can rise with pancreatitis, gallstones, or salivary gland issues.',
    simpleExplanation: 'Measures an enzyme involved in digestion.',
    recommendation: 'High levels are often followed by lipase and abdominal assessment.'
  },
  {
    name: 'Lipase',
    normalRange: '10–140 U/L',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest pancreatitis or other pancreatic disease.',
    simpleExplanation: 'Measures an enzyme made by the pancreas.',
    recommendation: 'Elevated lipase often requires review of abdominal symptoms.'
  },
  {
    name: 'PSA',
    normalRange: '0.0–4.0 ng/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest prostate enlargement, inflammation, or cancer.',
    simpleExplanation: 'Measures prostate-specific antigen in the blood.',
    recommendation: 'Elevated PSA should be discussed with a clinician, especially with urinary symptoms.'
  },
  {
    name: 'Prolactin',
    normalRange: '2–29 ng/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest pituitary disease, stress, or medication effects.',
    simpleExplanation: 'Measures a hormone involved in milk production and reproductive function.',
    recommendation: 'High prolactin may require endocrine evaluation.'
  },
  {
    name: 'Testosterone',
    normalRange: 'Male: 300–1000 ng/dL; Female: 15–70 ng/dL',
    lowMeaning: 'May suggest low testosterone affecting energy, libido, or mood.',
    highMeaning: 'May be linked to supplements or certain endocrine conditions.',
    simpleExplanation: 'Measures the main male sex hormone, which also affects women.',
    recommendation: 'Abnormal levels should be reviewed in context with symptoms and other hormones.'
  },
  {
    name: 'Estrogen',
    normalRange: 'Female: 30–400 pg/mL; Male: 10–40 pg/mL',
    lowMeaning: 'May be seen with low ovarian function or menopause.',
    highMeaning: 'May be seen with hormone therapy or certain conditions.',
    simpleExplanation: 'Measures the main female sex hormone involved in reproductive health.',
    recommendation: 'Interpretation depends on age, sex, and menstrual status.'
  },
  {
    name: 'Cortisol',
    normalRange: 'Morning: 5–25 µg/dL',
    lowMeaning: 'May suggest adrenal insufficiency.',
    highMeaning: 'May suggest stress, Cushing syndrome, or steroid use.',
    simpleExplanation: 'Measures a hormone made by the adrenal glands that responds to stress.',
    recommendation: 'Abnormal cortisol should be interpreted with symptoms and timing of collection.'
  },
  {
    name: 'D-dimer',
    normalRange: '< 500 ng/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May indicate clotting or inflammation, though it can also be elevated in pregnancy or illness.',
    simpleExplanation: 'Measures a protein fragment released when blood clots break down.',
    recommendation: 'A high result often needs clinical context and sometimes imaging.'
  },
  {
    name: 'INR',
    normalRange: '0.9–1.1',
    lowMeaning: 'Usually not a concern; very low values may increase clotting risk.',
    highMeaning: 'May increase bleeding risk, especially in people taking anticoagulants.',
    simpleExplanation: 'Measures how long blood takes to clot.',
    recommendation: 'A high INR should be reviewed carefully, especially if bruising or bleeding occurs.'
  },
  {
    name: 'PT',
    normalRange: '11–13.5 seconds',
    lowMeaning: 'May indicate a clotting tendency or high vitamin K.',
    highMeaning: 'May suggest a bleeding tendency or liver disease.',
    simpleExplanation: 'Measures the clotting time of the blood.',
    recommendation: 'Abnormal PT is often reviewed with INR and aPTT.'
  },
  {
    name: 'aPTT',
    normalRange: '25–35 seconds',
    lowMeaning: 'May suggest clotting tendency.',
    highMeaning: 'May suggest a bleeding tendency or heparin use.',
    simpleExplanation: 'Measures another pathway of blood clotting.',
    recommendation: 'Elevated values may need review if there is bruising or bleeding.'
  },
  {
    name: 'CK',
    normalRange: '22–198 U/L',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest muscle injury, exercise, or medication effects.',
    simpleExplanation: 'Measures creatine kinase, an enzyme released by muscle tissue.',
    recommendation: 'Very high levels may warrant review of muscle symptoms and recent activity.'
  },
  {
    name: 'CK-MB',
    normalRange: '0–5 ng/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest heart muscle injury, especially after a heart attack.',
    simpleExplanation: 'Measures a specific form of CK found in heart muscle.',
    recommendation: 'High CK-MB is usually interpreted with troponin and symptoms.'
  },
  {
    name: 'BNP',
    normalRange: '< 100 pg/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest heart failure or pressure overload of the heart.',
    simpleExplanation: 'Measures a hormone released by the heart when it is under strain.',
    recommendation: 'High BNP often warrants cardiac assessment.'
  },
  {
    name: 'Troponin I',
    normalRange: '< 0.04 ng/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May indicate heart muscle injury such as a heart attack.',
    simpleExplanation: 'Measures a protein released when the heart muscle is damaged.',
    recommendation: 'Elevated troponin should be reviewed urgently with clinical symptoms.'
  },
  {
    name: 'NT-proBNP',
    normalRange: '< 125 pg/mL',
    lowMeaning: 'Usually not a concern.',
    highMeaning: 'May suggest heart failure or fluid overload.',
    simpleExplanation: 'Measures a heart-related peptide used in heart failure assessment.',
    recommendation: 'High values often need cardiology review.'
  },
  {
    name: 'HBsAg',
    normalRange: 'Negative',
    lowMeaning: 'A negative result usually means no current hepatitis B infection detected.',
    highMeaning: 'A positive result may indicate active hepatitis B infection.',
    simpleExplanation: 'Tests for the surface antigen of the hepatitis B virus.',
    recommendation: 'Positive results should be reviewed by a clinician and may prompt further hepatitis B tests.'
  },
  {
    name: 'HIV Antibody',
    normalRange: 'Negative',
    lowMeaning: 'A negative result usually means no HIV antibodies detected.',
    highMeaning: 'A positive result may require confirmatory testing.',
    simpleExplanation: 'Checks for HIV antibodies in the blood.',
    recommendation: 'Positive results should be confirmed with follow-up testing.'
  },
  {
    name: 'IgA',
    normalRange: '70–400 mg/dL',
    lowMeaning: 'May suggest immune deficiency or selective IgA deficiency.',
    highMeaning: 'May be increased in chronic inflammation or autoimmune disease.',
    simpleExplanation: 'Measures immunoglobulin A, an antibody involved in mucosal defense.',
    recommendation: 'Abnormal levels may need review if repeated infections or allergies are present.'
  },
  {
    name: 'IgG',
    normalRange: '700–1600 mg/dL',
    lowMeaning: 'May suggest immune deficiency or protein loss.',
    highMeaning: 'May be increased with chronic inflammation or autoimmune disease.',
    simpleExplanation: 'Measures immunoglobulin G, the most common antibody in the blood.',
    recommendation: 'Significant abnormalities may require specialist review.'
  },
  {
    name: 'IgM',
    normalRange: '40–230 mg/dL',
    lowMeaning: 'May suggest immune deficiency or certain infections.',
    highMeaning: 'May be elevated in autoimmune disease or recent infection.',
    simpleExplanation: 'Measures immunoglobulin M, which is often the first antibody made during infection.',
    recommendation: 'Interpretation depends on symptoms and other immune tests.'
  },
  {
    name: 'Chloride',
    normalRange: '96–106 mmol/L',
    lowMeaning: 'May indicate fluid loss, vomiting, or metabolic alkalosis.',
    highMeaning: 'May indicate dehydration, kidney disease, or metabolic acidosis.',
    simpleExplanation: 'Measures an electrolyte that helps balance fluids and acid-base status.',
    recommendation: 'Abnormal chloride is often interpreted with sodium and bicarbonate results.'
  },
  {
    name: 'Bicarbonate',
    normalRange: '22–26 mmol/L',
    lowMeaning: 'May suggest metabolic acidosis.',
    highMeaning: 'May suggest metabolic alkalosis.',
    simpleExplanation: 'Measures the blood’s buffering system that helps keep acid-base balance.',
    recommendation: 'Abnormal bicarbonate often requires assessment of breathing and kidney function.'
  }
];

export default medicalReference;
