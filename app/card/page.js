"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./cardPage.css";
import "./cardPage-mobile.css";
import FloatingToolbar from "../components/FloatingToolBar-Card";
import AddTimelineModal from "./AddTimelineModal";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  fetchTimeline,
  upsertTimelineBulk,
  uploadTimelineFile,
  fetchUserName,
} from "../utils/firebaseDb-records";

import LifeRecord from "./LifeRecord";

export default function page() {}
