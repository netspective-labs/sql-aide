\set varName1 varValue1
\set varName2 varValue2

select * from :"varName1";
select * from :"varName1" where column = :'varName2';