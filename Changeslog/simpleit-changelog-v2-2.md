# SimpleIT v2.2 Changes Log

## 🔧 Import/Export Fixes
- Fixed employee import not importing: exit date, corporate email, personal email
- Fixed asset import not importing: Out of Box OS, Life Span, assigned employee ID
- Fixed employee export using wrong field mappings (employeeId → empId, position → title)
- Updated import schema to remove generic "email" field requirement
- Fixed field name inconsistencies between frontend and database schema

## 📊 Employee Data Structure Improvements  
- Separated email fields into personal email and corporate email (both optional)
- Removed dependency on legacy "email" field for cleaner data structure
- Fixed EmployeesTable.tsx displaying empty Employee ID and Title columns
- Updated employee export to use correct field names without fallbacks

## 🎯 Template & Schema Updates
- Updated employee import template to include Personal Email and Corporate Email headers
- Modified import-schema.ts to properly define corporateEmail and personalEmail fields
- Fixed import processing in routes.ts to handle new email field structure
- Ensured template generation matches import schema requirements

## 🔍 Field Mapping Corrections
- Fixed frontend table component using incorrect field references
- Corrected export endpoint field fallback logic for cleaner data separation
- Updated import processing to properly map CSV headers to database columns
- Resolved duplicate code and inconsistencies in routes.ts import logic

**Version:** 2.2  
**Date:** August 18, 2025  
**Author:** System Administrator