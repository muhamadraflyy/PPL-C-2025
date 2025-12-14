import React from "react";

const DetailItem = ({ label, value }) => (
 <div className="mb-3">
   <p className="text-sm font-semibold text-gray-500">{label}</p>
   <p className="text-base font-medium text-gray-900">{value}</p>
 </div>
);

export default DetailItem;