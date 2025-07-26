"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChildhoodGallery from "./ChildhoodGallery";
import ExperienceGallery from "./ExperienceGallery";
import RelationshipGallery from "./RelationshipGallery";
import { auth } from "../firebase/firebaseConfig";
import { fetchUserData, savePhotoGalleryCategory } from "../utils/firebaseDb";
import GalleryHeader from "../components/GalleryHeader";

export default function GalleryPage() {
  const params = useSearchParams();
  const selectedCategory = params.get("category") || "childhood";
  const [userId, setUserId] = useState(null);
  const [galleryData, setGalleryData] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    console.log(user);
    if (user) {
      setUserId(user.uid);
      fetchUserData(user.uid).then((data) => {
        console.log(data);
        setGalleryData(data?.photoGallery || {});
      });
    }
  }, []);

  const handleSave = async (categoryKey, data) => {
    if (!userId) return;
    const update = await { ...galleryData, [categoryKey]: data };
    console.log(data);
    console.log(categoryKey);
    console.log(update[categoryKey]);
    await savePhotoGalleryCategory(userId, categoryKey, update[categoryKey]);
    setGalleryData(update);
    alert("저장되었습니다.");
  };

  const renderCategoryComponent = () => {
    if (!userId || !galleryData) return null;

    switch (selectedCategory) {
      case "childhood":
        return (
          <ChildhoodGallery
            userId={userId}
            initialData={galleryData.childhood || []}
            handleSave={(data) => handleSave("childhood", data)}
          />
        );
      case "experience":
        return (
          <ExperienceGallery
            userId={userId}
            initialData={galleryData.experience || []}
            handleSave={(data) => handleSave("experience", data)}
          />
        );
      case "relationship":
        return (
          <RelationshipGallery
            userId={userId}
            initialData={galleryData.relationship || {}}
            handleSave={(data) => handleSave("relationship", data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        paddingTop: "60px",
        fontFamily: "pretendard",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems:"center"
      }}
    >
      <GalleryHeader />
      <div
        style={{
          width:"100vw",
          maxWidth: "768px",
        }}
      >
        {renderCategoryComponent()}
      </div>
    </div>
  );
}
