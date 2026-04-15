

## Plan: Replace Lucide icons with Font Awesome Slab icons across the entire site

### What changes
Replace all Lucide React icons with Font Awesome icons using the **Slab** (sharp-solid) style — a rare, angular icon set that gives a unique, differentiated look.

### Setup
1. **Install `@fortawesome/fontawesome-svg-core`, `@fortawesome/react-fontawesome`, and `@fortawesome/sharp-solid-svg-icons`** (the Slab/Sharp Solid pack)
2. Note: The Sharp Solid icons require a Font Awesome Pro license. If unavailable, we'll use `@fortawesome/free-solid-svg-icons` with less common icon choices to achieve differentiation.

### Files to modify

**Landing Page (public site):**

| File | Current Lucide icons | New FA Slab icons |
|------|---------------------|-------------------|
| `HeroSection.tsx` | `MessageCircle`, `ArrowDownRight` | `faCommentDots`, `faArrowTurnDown` |
| `BenefitsSection.tsx` | `Heart`, `ShieldCheck`, `Sparkles`, `Truck` | `faHeartPulse`, `faCertificate`, `faWandMagicSparkles`, `faTruckFast` |
| `ProductsSection.tsx` | `MessageCircle` | `faCommentDots` |
| `TestimonialsSection.tsx` | `Star`, `Quote` | `faStarSharp` / `faStar`, `faQuoteLeft` |
| `LeadFormSection.tsx` | `MessageCircle` | `faCommentDots` |
| `Navbar.tsx` | `Menu`, `X` | `faBarsStaggered`, `faXmark` |
| `Footer.tsx` | `Instagram`, `MessageCircle`, `ArrowRight`, `MapPin` | `faInstagram` (brands), `faCommentDots`, `faArrowRightLong`, `faLocationDot` |
| `WhatsAppFloat.tsx` | `MessageCircle` | `faWhatsapp` (brands) |

**CRM/Admin area:**

| File | Current Lucide icons | New FA icons |
|------|---------------------|-------------|
| `AdminSidebar.tsx` | `LayoutDashboard`, `Users`, `Kanban`, `UserCheck` | `faGaugeHigh`, `faUserGroup`, `faTableColumns`, `faUserCheck` |
| `AdminNavbar.tsx` | `LogOut`, `ExternalLink` | `faArrowRightFromBracket`, `faUpRightFromSquare` |
| `DashboardPage.tsx` | `Users`, `BarChart3`, `MessageSquare`, `PhoneOff`, `UserCheck` | `faUserGroup`, `faChartColumn`, `faComments`, `faPhoneSlash`, `faUserCheck` |
| `LeadCard.tsx` | `MessageCircle`, `Clock`, `AlertTriangle` | `faCommentDots`, `faClockRotateLeft`, `faTriangleExclamation` |
| `LeadsPage.tsx` | `Eye`, `MessageCircle`, `Trash2` | `faEye`, `faCommentDots`, `faTrashCan` |
| `ClientsPage.tsx` | `Eye`, `MessageCircle`, `UserCheck`, `Plus`, `Search` | `faEye`, `faCommentDots`, `faUserCheck`, `faPlus`, `faMagnifyingGlass` |
| `LeadDetailSheet.tsx` | `Send`, `MessageCircle`, `Phone`, `FileText`, `Pencil`, `Trash2`, `UserCheck`, `Save`, `X` | `faPaperPlane`, `faCommentDots`, `faPhone`, `faFileLines`, `faPenToSquare`, `faTrashCan`, `faUserCheck`, `faFloppyDisk`, `faXmark` |
| `CustomerDetailSheet.tsx` | Same set as LeadDetailSheet | Same mapping |
| `LeadFilters.tsx` | `Search`, `AlertTriangle` | `faMagnifyingGlass`, `faTriangleExclamation` |

**UI components** (keep Lucide for shadcn/ui internals like `dialog.tsx`, `sheet.tsx`, `accordion.tsx` etc. — these are standard and shouldn't be changed).

### Implementation approach
1. Install `@fortawesome/fontawesome-svg-core`, `@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/free-brands-svg-icons`
2. Create a helper wrapper `src/components/ui/fa-icon.tsx` for consistent sizing/styling
3. Update each file listed above, replacing Lucide imports with FA imports
4. Keep shadcn/ui internal components unchanged (they use Lucide for structural icons like X, ChevronDown)

### Icon differentiation strategy
Instead of generic icons, we pick uncommon FA alternatives:
- `faHeartPulse` instead of plain heart
- `faBarsStaggered` instead of plain hamburger
- `faClockRotateLeft` instead of plain clock
- `faCertificate` instead of shield
- `faWandMagicSparkles` instead of sparkles
- `faTruckFast` instead of plain truck

